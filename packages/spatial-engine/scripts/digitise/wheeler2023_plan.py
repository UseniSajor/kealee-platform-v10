import json, math, sys, numpy as np
from shapely.geometry import Polygon, LineString, Point, MultiPolygon, box
from shapely.ops import unary_union
from scipy import ndimage
S=sys.argv[1]
g=json.load(open(f"{S}/wheeler2023-georef.json")); P=Polygon(g['parcel']); stated=g['stated']
lots={k:Polygon(v['ring']) for k,v in g['lots'].items()}
order=[f'LOT {i}' for i in range(1,20)]+['PARKLAND']
# ── the street corridor as the 2023 sheet has it: gaps between lots wider than ~16 ft ──
gaps=P.difference(unary_union(list(lots.values())))
corridor=gaps.buffer(-8).buffer(8.5).simplify(2.5).buffer(0)
corridor=max(corridor.geoms,key=lambda q:q.area) if corridor.geom_type=='MultiPolygon' else corridor
print('corridor', round(corridor.area), 'sf')
# Wheeler frontage line = the parcel edge nearest the lots 16–19 side: the longest parcel edge
pr=list(P.exterior.coords)[:-1]
edges=[(LineString([pr[i],pr[(i+1)%len(pr)]]),i) for i in range(len(pr))]
wheeler=max(edges,key=lambda e:e[0].length)[0]
wA,wB=np.array(wheeler.coords[0]),np.array(wheeler.coords[1]); wu=(wB-wA)/np.linalg.norm(wB-wA); wn=np.array([-wu[1],wu[0]])
if np.dot(np.array(P.centroid.coords[0])-wA, wn)<0: wn=-wn   # inward
# ── where the corridor touches Wheeler: the openings (entries) ──
touch=corridor.intersection(wheeler.buffer(2.0))
openings=[q for q in (touch.geoms if hasattr(touch,'geoms') else [touch]) if q.area>20]
opens=[]
for q in openings:
    c=np.array(q.centroid.coords[0]); st=float(np.dot(c-wA,wu)); opens.append((st,q))
opens.sort(key=lambda t:t[0]); print('openings on Wheeler at stations', [round(s) for s,_ in opens], '(of', round(wheeler.length),')')
# the alley: the narrow part of the corridor
wide=corridor.buffer(-15).buffer(15.5)
alley=corridor.difference(wide)
alley=max(alley.geoms,key=lambda q:q.area) if alley.geom_type=='MultiPolygon' else alley
print('alley', round(alley.area), 'sf, ~', round(alley.area/ max(alley.length/2,1)), 'ft wide')
# alley axis from its minimum rotated rectangle
mrr=alley.minimum_rotated_rectangle; mc=list(mrr.exterior.coords)[:-1]
e1=np.linalg.norm(np.array(mc[1])-np.array(mc[0])); e2=np.linalg.norm(np.array(mc[2])-np.array(mc[1]))
if e1>=e2: a0=(np.array(mc[0])+np.array(mc[3]))/2; a1=(np.array(mc[1])+np.array(mc[2]))/2
else: a0=(np.array(mc[0])+np.array(mc[1]))/2; a1=(np.array(mc[2])+np.array(mc[3]))/2
if np.dot(a0-wA,wn)>np.dot(a1-wA,wn): a0,a1=a1,a0   # a0 at the Wheeler end
ad=(a1-a0)/np.linalg.norm(a1-a0)
alley_len=float(np.linalg.norm(a1-a0)); print('alley axis', round(alley_len), 'ft, bearing dir', ad.round(3))
# ── which opening is the loop's east entry (keep) and which is the west end (turnaround) ──
# the alley opening is the one nearest the alley's Wheeler end
alley_st=float(np.dot(a0-wA,wu))
loop_opens=[o for o in opens if abs(o[0]-alley_st)>60]
east=max(loop_opens,key=lambda t:t[0]); west=min(loop_opens,key=lambda t:t[0])
print('entry kept at station', round(east[0]), '; turnaround replaces the opening at', round(west[0]), '; alley met Wheeler at', round(alley_st))
BULB_R=50
# the loop's width as the sheet draws it: the largest inscribed half-width away from the alley
loop_only=corridor.difference(alley.buffer(30))
hw=0
for h in range(15,31):
    if loop_only.buffer(-h).area>2000: hw=h
HALF=hw+1   # the alley is widened to the same section as the loop
print('loop half-width measured', hw, 'ft → Wahalla Court R/W', 2*HALF, 'ft throughout')
def leg_axis(opening_poly):
    """direction of the corridor leg leaving Wheeler at this opening, from the corridor within 150 ft of it."""
    c=np.array(opening_poly.centroid.coords[0])
    part=corridor.intersection(Point(c).buffer(160)).difference(alley.buffer(30))
    part=max(part.geoms,key=lambda q:q.area) if part.geom_type=='MultiPolygon' else part
    m=part.minimum_rotated_rectangle; mc=list(m.exterior.coords)[:-1]
    e1=np.linalg.norm(np.array(mc[1])-np.array(mc[0])); e2=np.linalg.norm(np.array(mc[2])-np.array(mc[1]))
    if e1>=e2: p0=(np.array(mc[0])+np.array(mc[3]))/2; p1=(np.array(mc[1])+np.array(mc[2]))/2
    else: p0=(np.array(mc[0])+np.array(mc[1]))/2; p1=(np.array(mc[2])+np.array(mc[3]))/2
    d=p1-p0; d/=np.linalg.norm(d)
    if np.dot(d,wn)<0: d=-d
    # entry point on Wheeler: project c onto the Wheeler line
    t=float(np.dot(c-wA,wu)); e=wA+wu*t
    return e,d
# ── edits ──
new_corr=corridor
# 1. alley → 50' street: widen along its axis, from Wheeler to the loop
alley_wide=LineString([tuple(a0-ad*10),tuple(a1+ad*10)]).buffer(HALF, cap_style=2).intersection(P)
new_corr=unary_union([new_corr, alley_wide])
# 2. west opening → turnaround: drop the corridor within (BULB_R+30) of Wheeler along that leg, add a bulb
we,wd=leg_axis(west[1])
cut=LineString([tuple(we-wd*5),tuple(we+wd*(BULB_R+40))]).buffer(HALF+30, cap_style=2)
# remove only the part of the corridor near this leg (not the alley)
new_corr=new_corr.difference(cut.difference(alley_wide.buffer(1)))
bulb_w=Point(tuple(we+wd*(BULB_R+45))).buffer(BULB_R, resolution=24)
new_corr=unary_union([new_corr,bulb_w])
# 3. the alley's Wheeler end → turnaround too (one entry only)
cut2=LineString([tuple(a0-ad*5),tuple(a0+ad*(BULB_R+40))]).buffer(HALF+2, cap_style=2)
new_corr=new_corr.difference(cut2)
bulb_a=Point(tuple(a0+ad*(BULB_R+45))).buffer(BULB_R, resolution=24)
new_corr=unary_union([new_corr,bulb_a]).intersection(P)
new_corr=max(new_corr.geoms,key=lambda q:q.area) if new_corr.geom_type=='MultiPolygon' else new_corr
print('new corridor', round(new_corr.area), 'sf (was', round(corridor.area), ')')
# ── re-cut every lot to the nearest original lot, on the ground the street does not take ──
ground=P.difference(new_corr)
minx,miny,maxx,maxy=P.bounds; RES=0.5   # ft per px
W=int((maxx-minx)/RES)+3; H=int((maxy-miny)/RES)+3
from PIL import Image, ImageDraw
def rast(poly, val, img):
    d=ImageDraw.Draw(img)
    for q in (poly.geoms if hasattr(poly,'geoms') else [poly]):
        if q.is_empty: continue
        d.polygon([((x-minx)/RES,(maxy-y)/RES) for x,y in q.exterior.coords], fill=val)
        for hole in q.interiors: d.polygon([((x-minx)/RES,(maxy-y)/RES) for x,y in hole.coords], fill=0)
lab=Image.new('I',(W,H),0)
for i,k in enumerate(order): rast(lots[k], i+1, lab)
lab=np.array(lab)
gmask=Image.new('L',(W,H),0); rast(ground, 255, gmask); gmask=np.array(gmask)>0
dist,(iy,ix)=ndimage.distance_transform_edt(lab==0, return_indices=True)
assign=lab[iy,ix]; assign[~gmask]=0
final={}
for i,k in enumerate(order):
    m=assign==i+1
    if not m.any(): print(k,'GONE'); continue
    ys,xs=np.where(m); rects=[]
    for y in np.unique(ys):
        row=xs[ys==y]; row.sort(); st=row[0]; prev=row[0]
        for x in row[1:]:
            if x!=prev+1: rects.append(box(st,y,prev+1,y+1)); st=x
            prev=x
        rects.append(box(st,y,prev+1,y+1))
    poly=unary_union(rects)
    if poly.geom_type!='Polygon': poly=max(poly.geoms,key=lambda q:q.area)
    poly=poly.simplify(2.5)
    ring=[(minx+x*RES, maxy-y*RES) for x,y in poly.exterior.coords]
    pg=Polygon(ring)
    if not pg.exterior.is_ccw: ring=ring[::-1]
    final[k]={'ring':[list(map(float,p)) for p in ring[:-1]],'sqFt':round(pg.area)}
for k in order: print(f"  {k:9s} {final[k]['sqFt']:6d} sf (sheet {stated[k]:8.0f})" + ('  <9,500' if k!='PARKLAND' and final[k]['sqFt']<9500 else ''))
# ── street rings, pavement, centrelines ──
pav=new_corr.buffer(-(HALF-13)).buffer(0)
# centreline of the loop: the corridor's middle band, ordered by angle about the parkland (the loop wraps it)
pk=np.array(lots['PARKLAND'].centroid.coords[0])
loop_band=new_corr.difference(alley_wide.buffer(HALF+2)).buffer(-(HALF-2))
bpts=np.array([c for q in (loop_band.geoms if hasattr(loop_band,'geoms') else [loop_band]) for c in q.exterior.coords])
ang=np.arctan2(bpts[:,1]-pk[1], bpts[:,0]-pk[0])
ee,ed=leg_axis(east[1]); ang_e=math.atan2(ee[1]-pk[1], ee[0]-pk[0]); ang_w=math.atan2(bulb_w.centroid.y-pk[1], bulb_w.centroid.x-pk[0])
# go from the entry angle to the bulb angle the way the loop runs (the direction with the most band points)
def unwrap(a, a0): return (a-a0)%(2*math.pi)
d1=unwrap(ang_w,ang_e); fwd=[(unwrap(a,ang_e),i) for i,a in enumerate(ang)]
n_fwd=sum(1 for u,i in fwd if u<=d1+0.05); n_bwd=len(fwd)-n_fwd
if n_fwd>=n_bwd: seq=sorted((u,i) for u,i in fwd if u<=d1+0.05)
else: seq=sorted(((2*math.pi-u),i) for u,i in fwd if u>=d1-0.05)
ordered=[bpts[i] for u,i in seq]
# thin by angle bins (average points per 2° bin) to get one line through the band
bins={}
for u,i in seq: bins.setdefault(int(u/math.radians(2.5)),[]).append(bpts[i])
main=[ee]+[np.mean(v,axis=0) for k,v in sorted(bins.items())]+[np.array(bulb_w.centroid.coords[0])]
main=[m for j,m in enumerate(main) if j==0 or np.linalg.norm(m-main[j-1])>4]
branch=[np.array(bulb_a.centroid.coords[0]), a1+ad*(HALF)]   # from its turnaround to the junction with the loop
def thin(path, step=12):
    out=[path[0]]
    for p in path[1:]:
        if np.linalg.norm(p-out[-1])>=step: out.append(p)
    if np.linalg.norm(path[-1]-out[-1])>1: out.append(path[-1])
    return [list(map(float,p)) for p in out]
print('centreline main', len(main), 'pts,', round(LineString(main).length), 'ft; branch', round(LineString(branch).length), 'ft')
def rings_of(geom): return [[list(map(float,p)) for p in q.exterior.coords[:-1]] for q in (geom.geoms if hasattr(geom,'geoms') else [geom]) if not q.is_empty]
plan={'parcel':g['parcel'],'lots':{k:final[k] for k in order if k in final},'street':{'rowRings':rings_of(new_corr),'pavementRings':rings_of(pav),'centrelines':[thin(main), thin(branch)],'rowSqFt':round(new_corr.area),
  'entryStationFt':round(east[0]),'bulbs':[list(map(float,bulb_w.centroid.coords[0])),list(map(float,bulb_a.centroid.coords[0]))],'wheeler':{'A':list(map(float,wA)),'B':list(map(float,wB))}},
  'edits':{'alleyWidenedToFt':2*HALF,'alleyAxisFt':round(alley_len),'westOpeningStation':round(west[0]),'alleyOpeningStation':round(alley_st)}}
json.dump(plan, open(f"{S}/wheeler2023-plan.json",'w'))
print('plan written')
