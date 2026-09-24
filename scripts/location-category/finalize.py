"""Reviewed images → assets/pics, one attribution line each, and the drafts CSV.

usage: finalize.py <built-dir> <csv-out>   (keys: the non-spare rows of spec.json,
       with any spare swapped in through SWAP below)
"""
import csv, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(f'{HERE}/../..')
SWAP = {}  # main key → spare key, for images that failed review

LICENCE = ('غير مرخّصة — لقطة من خرائط قوقل (نمط الخريطة) طُمس فيها اسم المكان ووُضع عليه دبّوس، '
           'على نهج قرار علي ١٩ سبتمبر ٢٠٢٦ في صور الويب (الحقوق على مسؤوليته)')

spec = {r['key']: r for r in json.load(open(f'{HERE}/spec.json'))}
rows = []
for r in spec.values():
    if r['spare']:
        continue
    s = spec[SWAP[r['key']]] if r['key'] in SWAP else r
    rows.append({**s, 'level': r['level']})

built, out = sys.argv[1], sys.argv[2]
att_path = f'{ROOT}/assets/pics/attribution.json'
att = json.load(open(att_path))
att = [a for a in att if not a['key'].startswith('loc-')]
for r in rows:
    shutil.copy(f'{built}/pic-loc-{r["key"]}.jpg', f'{ROOT}/assets/pics/pic-loc-{r["key"]}.jpg')
    att.append({
        'key': f'loc-{r["key"]}',
        'licence': LICENCE,
        'artist': 'Google Maps',
        'page': f'خرائط قوقل — {r["answer"]}',
        'source': f'https://www.google.com/maps/@{r["lat"]:.6f},{r["lon"]:.6f},{r["z"]}z',
    })
with open(att_path, 'w') as f:
    json.dump(att, f, ensure_ascii=False, indent=2)
    f.write('\n')

with open(out, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['التصنيف', 'المستوى', 'السؤال', 'الإجابة', 'الصورة'])
    for r in rows:
        w.writerow(['لوكيشن', r['level'], 'ما هذا المكان؟', r['answer'], f'pic-loc-{r["key"]}'])
print(len(rows), 'rows')
