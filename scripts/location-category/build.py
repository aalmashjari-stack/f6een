"""Location pictures, end to end: fetch → find labels → blur → pin → save.

Labels are found by *difference*, not by OCR: the same map is fetched three times
through Google's `apistyle` — as is, with POI labels off (s.t:2), and with all
labels off — so every label is exactly the set of pixels that changes. The
place's own label is the POI label nearest the centre (the map is centred on
it); every other label is read by tesseract **alone in its own crop** (far
better than OCR over the whole map) and blurred when it carries one of the
place's name forms. Manual boxes cover what OCR still misses — each image is
checked by eye.

usage: build.py <spec.json> <outdir> [key ...]
spec rows: {"key","lat","lon","z","terms":[...],"manual":[[l,t,r,b],...],"keep_target":false}
"""
import difflib, hashlib, io, json, math, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pin import pin

CACHE = os.environ.get('LOC_CACHE', '/tmp/loc-tiles')
W, H = 800, 560           # CSS pixels; tiles are scale=2 so images are 1600×1120
OUT_W = 1200              # shipped width
STYLE = {'as-is': '', 'no-poi': 's.t:2|s.e:l|p.v:off', 'no-labels': 's.e:l|p.v:off'}


def px(lat, lon, z):
    s = 256 * 2 ** z
    x = (lon + 180) / 360 * s
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * s
    return x, y


def tile(tx, ty, z, style):
    os.makedirs(CACHE, exist_ok=True)
    f = f'{CACHE}/{z}-{tx}-{ty}-{hashlib.md5(style.encode()).hexdigest()[:8] if style else "m"}.png'
    if os.path.exists(f):
        return Image.open(f).convert('RGB')
    q = '&apistyle=' + style.replace(':', '%3A').replace('|', '%7C') if style else ''
    u = f'https://mt{(tx + ty) % 4}.google.com/vt/lyrs=m&hl=ar&gl=kw&scale=2&x={tx}&y={ty}&z={z}{q}'
    for _ in range(4):
        d = subprocess.run(['curl', '-s', '-m', '20', '-A', 'Mozilla/5.0', u], capture_output=True).stdout
        try:
            im = Image.open(io.BytesIO(d)); im.load(); im = im.convert('RGB')
            if im.size == (512, 512):
                im.save(f); return im
        except Exception:
            pass
    raise RuntimeError(f'tile failed {u}')


def grab(lat, lon, z, style):
    cx, cy = px(lat, lon, z); x0, y0 = cx - W / 2, cy - H / 2
    img = Image.new('RGB', (2 * W, 2 * H))
    T = [(tx, ty) for tx in range(int(x0 // 256), int((x0 + W) // 256) + 1)
         for ty in range(int(y0 // 256), int((y0 + H) // 256) + 1)]
    with ThreadPoolExecutor(6) as ex:
        for (tx, ty), t in zip(T, ex.map(lambda t: tile(t[0], t[1], z, style), T)):
            img.paste(t, (int(round(2 * (tx * 256 - x0))), int(round(2 * (ty * 256 - y0)))))
    return img


def label_boxes(a, b, min_px=40):
    """Labels as boxes: pixels that differ between two renderings, split into
    words (small dilation), then words joined into labels — same line and a
    word gap apart, or stacked lines of one label. A plain wide dilation
    merged neighbouring labels into one box spanning half the map."""
    d = np.abs(np.asarray(a, np.int16) - np.asarray(b, np.int16)).max(axis=2) > 30
    lab, n = ndimage.label(ndimage.binary_dilation(d, np.ones((7, 7), bool)))
    words = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if (d[sl] & (lab[sl] == i)).sum() < min_px:
            continue
        words.append([sl[1].start, sl[0].start, sl[1].stop, sl[0].stop])
    return group(words)


def group(bs, gap_x=12, gap_y=4, max_w=640, max_h=160):
    def near(p, q):
        vo = min(p[3], q[3]) - max(p[1], q[1]); ho = min(p[2], q[2]) - max(p[0], q[0])
        hgap = max(p[0], q[0]) - min(p[2], q[2]); vgap = max(p[1], q[1]) - min(p[3], q[3])
        similar = 0.6 <= (p[3] - p[1]) / max(1, q[3] - q[1]) <= 1.7
        same_line = similar and vo >= 0.6 * min(p[3] - p[1], q[3] - q[1]) and hgap <= gap_x
        stacked = similar and ho >= 0.4 * min(p[2] - p[0], q[2] - q[0]) and vgap <= gap_y
        u = (max(p[2], q[2]) - min(p[0], q[0]), max(p[3], q[3]) - min(p[1], q[1]))
        return (same_line or stacked) and u[0] <= max_w and u[1] <= max_h
    bs = [list(b) for b in bs]
    merged = True
    while merged:
        merged = False
        for i in range(len(bs)):
            for j in range(i + 1, len(bs)):
                if near(bs[i], bs[j]):
                    p, q = bs[i], bs.pop(j)
                    bs[i] = [min(p[0], q[0]), min(p[1], q[1]), max(p[2], q[2]), max(p[3], q[3])]
                    merged = True; break
            if merged: break
    return [tuple(b) for b in bs]


def grow_target(seed, others, reach=44, max_w=720, max_h=220):
    """The place's own label can come out as several POI groups — «برج» apart
    from «التحرير», or a third line — so swallow every POI group within a
    short reach of it, and stop at a sane label size."""
    box = list(seed); rest = list(others); grew = True
    while grew:
        grew = False
        for q in rest:
            gx = max(q[0] - box[2], box[0] - q[2], 0); gy = max(q[1] - box[3], box[1] - q[3], 0)
            u = [min(box[0], q[0]), min(box[1], q[1]), max(box[2], q[2]), max(box[3], q[3])]
            if gx <= reach and gy <= reach / 2 and u[2] - u[0] <= max_w and u[3] - u[1] <= max_h:
                box = u; rest.remove(q); grew = True; break
    return tuple(box)


def norm(s):
    s = re.sub(r'[ً-ْـ‎‏‭‬]', '', s)
    for a, b in (('أ', 'ا'), ('إ', 'ا'), ('آ', 'ا'), ('ة', 'ه'), ('ى', 'ي'), ('ڤ', 'ف')):
        s = s.replace(a, b)
    return re.sub(r'\s+', '', s.lower())


def lines(ink, bx, gap=3):
    """Text lines of a horizontal label, split on empty pixel rows. None for a single line."""
    l, t, r, b = bx
    rows = ink[t:b, l:r].any(axis=1)
    out, start, empty = [], None, 0
    for y, on in enumerate(rows):
        if on:
            if start is None: start = y
            empty = 0
        elif start is not None:
            empty += 1
            if empty >= gap:
                out.append((l, t + start, r, t + y - empty + 1)); start = None
    if start is not None:
        out.append((l, t + start, r, b))
    out = [o for o in out if o[3] - o[1] >= 12]
    return out if len(out) > 1 else []


def drop_icons(im):
    """White out solid blobs (POI icons, road shields): tesseract returns
    nothing at all for a label whose icon sits in the crop. An opening keeps
    what is thicker than a letter stroke and nothing else."""
    g = np.asarray(im.convert('L'))
    solid = ndimage.binary_opening(ndimage.binary_fill_holes(g < 225), np.ones((13, 13), bool))
    if not solid.any():
        return im
    solid = ndimage.binary_dilation(solid, np.ones((9, 9), bool))
    a = np.asarray(im.convert('RGB')).copy(); a[solid] = 255
    return Image.fromarray(a)


def ocr(im, icons=True):
    """tesseract on one label: 3× greyscale, both orientations for vertical street names."""
    texts = []
    im = ImageOps.expand(drop_icons(im) if icons else im, 24, fill='white')
    for rot in ((0, 90, 270) if im.height > 1.2 * im.width else (0,)):
        g = im.rotate(rot, expand=True).convert('L')
        g = g.resize((g.width * 3, g.height * 3), Image.LANCZOS)
        g = Image.eval(g, lambda v: 255 if v > 200 else v)  # drop map background
        buf = io.BytesIO(); g.save(buf, 'PNG')
        r = subprocess.run(['tesseract', '-', '-', '-l', 'ara+eng', '--psm', '6'],
                           input=buf.getvalue(), capture_output=True)
        texts.append(r.stdout.decode('utf8', 'replace').strip().replace('\n', ' '))
    return ' / '.join(t for t in texts if t)


def matches(text, terms):
    t = norm(text)
    for k in terms:
        k = norm(k)
        if not k:
            continue
        if k in t:
            return k
        if len(k) >= 4 and len(t) >= len(k) - 1:
            for i in range(0, max(1, len(t) - len(k) + 2)):
                if difflib.SequenceMatcher(None, k, t[i:i + len(k)]).ratio() >= (0.75 if len(k) >= 6 else 0.8):
                    return k
    return None


def inside(p, q):
    return p[0] >= q[0] and p[1] >= q[1] and p[2] <= q[2] and p[3] <= q[3]


def pixelate(im, box, pad=6):
    l, t, r, b = box
    bx = (max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad))
    reg = im.crop(bx); w, h = reg.size
    if w < 2 or h < 2:
        return
    bl = max(2, min(w, h) // 3)
    reg = reg.resize((max(1, w // bl), max(1, h // bl)), Image.BILINEAR).resize((w, h), Image.NEAREST)
    im.paste(reg.filter(ImageFilter.GaussianBlur(2)), bx)


def build(row, outd):
    k, la, lo, z = row['key'], row['lat'], row['lon'], row['z']
    a = grab(la, lo, z, STYLE['as-is'])
    nopoi = grab(la, lo, z, STYLE['no-poi'])
    nolab = grab(la, lo, z, STYLE['no-labels'])
    cx, cy = a.width / 2, a.height / 2

    def dist(bx):
        l, t, r, b = bx
        return math.hypot(max(l - cx, 0, cx - r), max(t - cy, 0, cy - b))

    poi = sorted(label_boxes(a, nopoi), key=dist)
    report = {'key': k, 'blurred': [], 'target': None}
    out = a.copy()
    if poi and not row.get('keep_target') and dist(poi[0]) < 140:
        tb = grow_target(poi[0], poi[1:])
        report['target'] = [tb, round(dist(poi[0]))]
        pixelate(out, tb)
    boxes = [bx for bx in label_boxes(a, nolab)
             if not (report['target'] and inside(bx, report['target'][0]))]
    ink = np.abs(np.asarray(a, np.int16) - np.asarray(nolab, np.int16)).max(axis=2) > 30

    grey = np.asarray(a.convert('L'), np.uint8)

    def masked(c):
        # label pixels only, black on white: coloured labels (purple parks,
        # orange restaurants) come back empty from the plain crop
        l, t, r, b = max(0, c[0]), max(0, c[1]), min(a.width, c[2]), min(a.height, c[3])
        g = grey[t:b, l:r].copy(); g[~ink[t:b, l:r]] = 255
        return ImageOps.autocontrast(Image.fromarray(g))

    def read(bx):
        # the label whole, then each of its text lines alone (tesseract drops
        # the second line of a two-line label more often than not), then the
        # ink mask widened sideways — a short word split off its label by the
        # grouping reads with its neighbours
        crops = [bx] + lines(ink, bx)
        out = [ocr(a.crop((c[0] - 10, c[1] - 10, c[2] + 10, c[3] + 10))) for c in crops]
        out += [ocr(masked((c[0] - 80, c[1] - 10, c[2] + 80, c[3] + 10)), icons=False) for c in crops]
        return ' / '.join(t for t in out if t)

    with ThreadPoolExecutor(os.cpu_count()) as ex:
        texts = list(ex.map(read, boxes))
    for bx, txt in zip(boxes, texts):
        hit = matches(txt, row['terms'])
        if hit:
            pixelate(out, bx); report['blurred'].append([bx, txt, hit])
    for m in row.get('manual', []):
        pixelate(out, tuple(m)); report['blurred'].append([m, '<manual>', ''])
    pin(out)
    out = out.resize((OUT_W, OUT_W * out.height // out.width), Image.LANCZOS)
    out.save(f'{outd}/pic-loc-{k}.jpg', quality=82, optimize=True, progressive=True)
    # review copy: blurred boxes outlined, full resolution kept for reading
    return report


if __name__ == '__main__':
    spec = json.load(open(sys.argv[1])); outd = sys.argv[2]; only = set(sys.argv[3:])
    os.makedirs(outd, exist_ok=True)
    for row in spec:
        if only and row['key'] not in only:
            continue
        rep = build(row, outd)
        print(json.dumps(rep, ensure_ascii=False), flush=True)
