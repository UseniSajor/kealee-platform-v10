import pymupdf, numpy as np, json, sys
from PIL import Image, ImageFilter
from scipy import ndimage
from shapely.geometry import box
from shapely.ops import unary_union
Image.MAX_IMAGE_PIXELS=None
S=sys.argv[1]
doc=pymupdf.open("existing site plans/Wheeler Rd Subdivision Layout.pdf")
page=doc[0]
labels={}
for b in page.get_text('dict')['blocks']:
    for l in b.get('lines',[]):
        for s in l['spans']:
            t=s['text'].strip()
            if (t.startswith('LOT ') and t[4:].isdigit()) or t=='PARKLAND':
                x0,y0,x1,y1=s['bbox']; labels.setdefault(t,((x0+x1)/2,(y0+y1)/2))
keep={'Property','Lots','Street','Parkland'}
for c in doc.layer_ui_configs(): doc.set_layer_ui_config(c['number'], action=0 if c['text'] in keep else 2)
SC=2
rm=page.rotation_matrix
pts=[pymupdf.Point(x,y)*rm for x,y in labels.values()]
clip=pymupdf.Rect(max(0,min(p.x for p in pts)-450),max(0,min(p.y for p in pts)-450),min(page.rect.width,max(p.x for p in pts)+450),min(page.rect.height,max(p.y for p in pts)+450))
pix=page.get_pixmap(matrix=pymupdf.Matrix(SC,SC), colorspace='gray', clip=clip)
a=np.frombuffer(pix.samples,dtype=np.uint8).reshape(pix.height,pix.width)
dark=(a<235)
# bridge the dash-dot gaps: close with a 22-px radius, then thin back so lines stay ~8 px
st=np.ones((45,45),dtype=bool)
R=int(sys.argv[2]) if len(sys.argv)>2 else 60   # closing radius, px
dil=ndimage.distance_transform_edt(~dark)<=R
closed=ndimage.distance_transform_edt(dil)>R-3
arr=np.where(closed,0,255).astype(np.uint8); H,W=arr.shape
lab,n=ndimage.label(arr==255)
print('components', n, flush=True)
sizes=ndimage.sum(np.ones_like(lab), lab, index=np.arange(1,n+1))
out={}
for name,(lx,ly) in labels.items():
    p=pymupdf.Point(lx,ly)*rm
    sx,sy=int((p.x-clip.x0)*SC),int((p.y-clip.y0)*SC)
    comp=lab[sy,sx]
    if comp==0:
        for r in range(1,80):
            for dy,dx in ((r,0),(-r,0),(0,r),(0,-r)):
                if 0<=sy+dy<H and 0<=sx+dx<W and lab[sy+dy,sx+dx]: comp=lab[sy+dy,sx+dx]; break
            if comp: break
    if comp==0: print(name,'no component'); continue
    if sizes[comp-1]>0.3*W*H: print(name,'LEAK'); continue
    m=lab==comp
    ys,xs=np.where(m)
    rects=[]
    for y in np.unique(ys):
        row=xs[ys==y]; row.sort(); start=row[0]; prev=row[0]
        for x in row[1:]:
            if x!=prev+1: rects.append(box(start,y,prev+1,y+1)); start=x
            prev=x
        rects.append(box(start,y,prev+1,y+1))
    poly=unary_union(rects)
    if poly.geom_type!='Polygon': poly=max(poly.geoms,key=lambda g:g.area)
    poly=poly.buffer(2.5, join_style=2).simplify(1.0)
    coords=[((x/SC)+clip.x0,(y/SC)+clip.y0) for x,y in poly.exterior.coords]
    out[name]={'ring':coords,'area_pt2':poly.area/SC/SC}
    print(name, 'area', round(poly.area/SC/SC), 'pt2 →', round(poly.area/SC/SC*(50/72)**2), 'sf at 1in=50ft', len(coords),'verts', flush=True)
json.dump(out, open(f"{S}/wheeler2023-lots-raster.json",'w'))
