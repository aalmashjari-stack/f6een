from PIL import Image, ImageDraw
def pin(im, cx=None, cy=None, size=110):
    """Google-style red marker whose tip sits on (cx,cy) — the map centre by default."""
    W,H=im.size; cx=W//2 if cx is None else cx; cy=H//2 if cy is None else cy
    S=4; big=Image.new('RGBA',(size*S,int(size*1.5)*S),(0,0,0,0)); d=ImageDraw.Draw(big)
    r=size*S//2; hx=size*S//2
    # shadow
    d.ellipse((hx-r*0.55, big.height-r*0.35, hx+r*0.55, big.height-r*0.05), fill=(0,0,0,70))
    # body: circle + triangle tip
    d.ellipse((hx-r,0,hx+r,2*r), fill=(234,67,53,255))
    d.polygon([(hx-r*0.72, r*1.7),(hx+r*0.72, r*1.7),(hx, big.height-r*0.2)], fill=(234,67,53,255))
    d.ellipse((hx-r,0,hx+r,2*r), fill=(234,67,53,255))
    d.ellipse((hx-r*0.38, r*0.62, hx+r*0.38, r*1.38), fill=(255,255,255,255))
    small=big.resize((size,int(size*1.5)),Image.LANCZOS)
    tipx,tipy=small.width//2,int(small.height-size*0.1)
    im.paste(small,(cx-tipx,cy-tipy),small)
    return im
if __name__=='__main__':
    import sys
    for p in sys.argv[1:]: pin(Image.open(p).convert('RGB')).save(p,quality=85,optimize=True)
