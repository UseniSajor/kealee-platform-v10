import json, math, numpy as np, itertools, sys
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union
S=sys.argv[1]
lots=json.load(open(f"{S}/wheeler2023-lots-raster.json"))
g=json.load(open(f"{S}/wheeler2023-georef.json")); parcel=g['parcel']
P=Polygon(parcel)
shrink=float(sys.argv[2]) if len(sys.argv)>2 else -1.75
rings={k:Polygon(v['ring']).buffer(shrink, join_style=2).simplify(0.6) for k,v in lots.items()}
U=unary_union([p.buffer(6) for p in rings.values()])
hs=U.convex_hull.simplify(80); ps=P.convex_hull.simplify(40)
def corners(poly):
    pts=list(poly.exterior.coords)[:-1]; n=len(pts); out=[]
    for i in range(n):
        a=np.array(pts[i-1]); b=np.array(pts[i]); c=np.array(pts[(i+1)%n]); v1=a-b; v2=c-b
        out.append((math.degrees(math.acos(max(-1,min(1,np.dot(v1,v2)/np.linalg.norm(v1)/np.linalg.norm(v2))))), pts[i]))
    return out
sc=sorted(corners(hs))[:3]; pc=sorted(corners(ps))[:3]
def fit(A,B,reflect):
    A2=A.copy()
    if reflect: A2[:,1]=-A2[:,1]
    ca,cb=A2.mean(0),B.mean(0); a0,b0=A2-ca,B-cb
    H=a0.T@b0; U_,S_,Vt=np.linalg.svd(H); Rm=Vt.T@U_.T
    if np.linalg.det(Rm)<0: Vt[-1]*=-1; Rm=Vt.T@U_.T
    s=S_.sum()/(a0**2).sum(); t=cb-s*(Rm@ca)
    res=np.sqrt((((s*(Rm@A2.T).T+t)-B)**2).sum(1).mean()); return s,Rm,t,res
best=None; B=np.array([p for a,p in pc])
for perm in itertools.permutations(range(3)):
    A=np.array([sc[i][1] for i in perm])
    for r in (False,True):
        s,Rm,t,res=fit(A,B,r)
        if best is None or res<best[3]: best=(s,Rm,t,res,r)
s,Rm,t,res,refl=best
# refine: ICP on rotation+translation+scale using every lot vertex within 12 ft of the parcel boundary
def tx_all(pts, s, Rm, t):
    A=np.array(pts, float).copy()
    if refl: A[:,1]=-A[:,1]
    return (s*(Rm@A.T).T+t)
bnd=P.exterior
allpts=[p for poly in rings.values() for p in list(poly.exterior.coords)[:-1]]
for it in range(6):
    T=tx_all(allpts, s, Rm, t)
    src=[]; dst=[]
    for p0,p1 in zip(allpts, T):
        d=bnd.distance(__import__('shapely.geometry',fromlist=['Point']).Point(p1))
        if d<15:
            q=bnd.interpolate(bnd.project(__import__('shapely.geometry',fromlist=['Point']).Point(p1)))
            src.append(p0); dst.append((q.x,q.y))
    A=np.array(src); B2=np.array(dst)
    s,Rm,t,res=fit(A,B2,refl)
    print(f'  icp {it}: {len(src)} boundary points, rms {res:.2f} ft, scale 1"={72*s:.2f}\'')
out={}
for k,poly in rings.items():
    T=tx_all(list(poly.exterior.coords)[:-1], s, Rm, t)
    pg=Polygon(T)
    ring=[list(map(float,p)) for p in T]
    if not pg.exterior.is_ccw: ring=ring[::-1]
    out[k]={'ring':ring,'sqFt':round(pg.area)}
tot=sum(v['sqFt'] for v in out.values()); print('lots+parkland', tot, 'sf; parcel', round(P.area), '→ street', round(P.area-tot))
stated={'LOT 1':12805.47,'LOT 2':9500.25,'LOT 3':9500.25,'LOT 4':9500.25,'LOT 5':9500.91,'LOT 6':9500.72,'LOT 7':9554.14,'LOT 8':9500.25,'LOT 9':9500.03,'LOT 10':9500.25,'LOT 11':9500.25,'LOT 12':9500.25,'LOT 13':13760.36,'LOT 14':9551.21,'LOT 15':9550.48,'LOT 16':9572.76,'LOT 17':9513.94,'LOT 18':9513.94,'LOT 19':9557.47,'PARKLAND':6051.48}
for k in sorted(out, key=lambda k:(len(k),k)): print(f"  {k:9s} {out[k]['sqFt']:6d} sf  stated {stated[k]:9.2f}  {100*(out[k]['sqFt']/stated[k]-1):+.1f}%")
json.dump({'transform':{'scaleFtPerPt':s,'rmsFt':res,'reflect':refl},'parcel':parcel,'lots':out,'stated':stated}, open(f"{S}/wheeler2023-georef.json",'w'))
