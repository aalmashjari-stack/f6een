import math, io, subprocess
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
def px(lat,lon,z):
    s=256*2**z; x=(lon+180)/360*s; y=(1-math.log(math.tan(math.radians(lat))+1/math.cos(math.radians(lat)))/math.pi)/2*s; return x,y
LYR='m'
def raw(tx,ty,z):
    u=f'https://mt{(tx+ty)%4}.google.com/vt/lyrs={LYR}&hl=ar&gl=kw&scale=2&x={tx}&y={ty}&z={z}'
    for _ in range(3):
        d=subprocess.run(['curl','-s','-m','15','-A','Mozilla/5.0',u],capture_output=True).stdout
        try: im=Image.open(io.BytesIO(d)); im.load(); return im.convert('RGB')
        except Exception: pass
    return None
def tile(tx,ty,z):
    im=raw(tx,ty,z)
    if im: return im
    p=tile(tx//2,ty//2,z-1)  # fallback: parent quadrant upscaled
    w=p.size[0]//2; qx,qy=(tx%2)*w,(ty%2)*w
    return p.crop((qx,qy,qx+w,qy+w)).resize((512,512),Image.BICUBIC)
def grab(lat,lon,z,W=800,H=560):
    cx,cy=px(lat,lon,z); x0,y0=cx-W/2,cy-H/2; img=Image.new('RGB',(2*W,2*H))
    T=[(tx,ty) for tx in range(int(x0//256),int((x0+W)//256)+1) for ty in range(int(y0//256),int((y0+H)//256)+1)]
    with ThreadPoolExecutor(6) as ex:
        for (tx,ty),t in zip(T,ex.map(lambda t:tile(t[0],t[1],z),T)): img.paste(t.resize((512,512)) if t.size!=(512,512) else t,(int(2*(tx*256-x0)),int(2*(ty*256-y0))))
    return img
if __name__=='__main__':
    import sys,json
    for row in json.load(open(sys.argv[1])):
        k,la,lo,z=row[:4]
        grab(la,lo,z).save(f'loc-{k}.jpg',quality=82,optimize=True); print(k,flush=True)
