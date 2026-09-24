import sys, subprocess, re, os, json
from PIL import Image, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__))
def norm(s): return re.sub(r'[ً-ْـ]','',s).replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ة','ه').replace('ى','ي').lower()
def ocr(path):
    out=[]
    for r in subprocess.run([HERE+'/ocr2',path],capture_output=True,text=True).stdout.splitlines():
        _,box,txt=r.split('\t',2); out.append((tuple(map(int,box.split(','))),txt))
    return out
def boxes(im, tmp):
    """OCR upright + both vertical orientations, boxes mapped back to upright coords."""
    W,H=im.size; res=[]
    im.save(tmp,quality=92); res+=ocr(tmp)
    im.transpose(Image.ROTATE_90).save(tmp,quality=92)   # CCW: (x,y)->(y,W-x)
    for (l,t,r,b),txt in ocr(tmp): res.append(((W-b,l,W-t,r),txt))
    im.transpose(Image.ROTATE_270).save(tmp,quality=92)  # CW: (x,y)->(H-y,x)
    for (l,t,r,b),txt in ocr(tmp): res.append(((t,H-r,b,H-l),txt))
    return res
def blur(path, out, terms, manual=()):
    im=Image.open(path).convert('RGB'); tmp=out+'.tmp.jpg'
    hits=[]
    for (l,t,r,b),txt in list(boxes(im,tmp))+[(tuple(m),'<manual>') for m in manual]:
        if txt=='<manual>' or any(norm(k) in norm(txt) for k in terms):
            pad=6; bx=(max(0,l-pad),max(0,t-pad),min(im.width,r+pad),min(im.height,b+pad))
            reg=im.crop(bx); w,h=reg.size
            if w<2 or h<2: continue
            bl=max(2,min(w,h)//3)
            reg=reg.resize((max(1,w//bl),max(1,h//bl)),Image.BILINEAR).resize((w,h),Image.NEAREST).filter(ImageFilter.GaussianBlur(2))
            im.paste(reg,bx); hits.append(txt)
    im.save(out,quality=85,optimize=True)
    left=[txt for _,txt in boxes(Image.open(out).convert('RGB'),tmp) if any(norm(k) in norm(txt) for k in terms)]
    os.remove(tmp)
    return hits,left
if __name__=='__main__':
    # usage: blur.py <spec.json> <indir> <outdir>   spec rows: [key, lat, lon, z, "term|term"]
    spec=json.load(open(sys.argv[1])); ind,outd=sys.argv[2],sys.argv[3]; os.makedirs(outd,exist_ok=True)
    for row in spec:
        k,terms=row[0],row[4].split('|'); manual=row[5] if len(row)>5 else ()
        hits,left=blur(f'{ind}/loc-{k}.jpg',f'{outd}/pic-loc-{k}.jpg',terms,manual)
        print(k,'blurred',len(hits),hits,'| remaining',left,flush=True)
