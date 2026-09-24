import sys, subprocess, re, os, json
from PIL import Image, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__))
def norm(s): return re.sub(r'[ً-ْـ]','',s).replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ة','ه').replace('ى','ي').lower()
def ocr(path):
    """Lines of text with boxes: Apple Vision (`ocr2`) on macOS, tesseract ara+eng elsewhere."""
    if os.path.exists(HERE+'/ocr2'):
        out=[]
        for r in subprocess.run([HERE+'/ocr2',path],capture_output=True,text=True).stdout.splitlines():
            _,box,txt=r.split('	',2); out.append((tuple(map(int,box.split(','))),txt))
        return out
    return tesseract(path)
def tesseract(path, up=2):
    """tesseract on a 2x greyscale copy; words grouped per line, boxes back in source pixels.
    Sparse-text mode (psm 11) suits map labels scattered over the tile."""
    im=Image.open(path).convert('L'); im=im.resize((im.width*up,im.height*up),Image.LANCZOS)
    tmp=path+'.ocr.png'; im.save(tmp)
    tsv=subprocess.run(['tesseract',tmp,'-','-l','ara+eng','--psm','11','tsv'],capture_output=True,text=True).stdout
    os.remove(tmp); lines={}
    for r in tsv.splitlines()[1:]:
        f=r.split('	')
        if len(f)<12 or not f[11].strip() or float(f[10])<0: continue
        l,t,w,h=(int(x)//up for x in f[6:10]); k=tuple(f[1:5])
        if k in lines:
            (L,T,R,B),txt=lines[k]; lines[k]=((min(L,l),min(T,t),max(R,l+w),max(B,t+h)),txt+' '+f[11])
        else: lines[k]=((l,t,l+w,t+h),f[11])
    # also each word alone, so a long merged line never hides a short name
    words=[]
    for r in tsv.splitlines()[1:]:
        f=r.split('	')
        if len(f)<12 or not f[11].strip() or float(f[10])<0: continue
        l,t,w,h=(int(x)//up for x in f[6:10]); words.append(((l,t,l+w,t+h),f[11]))
    return list(lines.values())+words
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
