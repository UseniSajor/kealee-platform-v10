"""Reproducible Porter document corrections. No surveyed elevations or approvals invented.
Run with Python plus pymupdf, shapely and pyproj. Baseline and sources are local.
"""
from pathlib import Path
import copy, hashlib, json, math, re
import pymupdf as pdf
from shapely.geometry import Polygon, LineString, Point, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
BASE = REPO / 'output/site-plans/porter-subdivision-permit-set.BEST-BACKUP.pdf'
T = json.loads((ROOT/'sources/generated-baseline.twin.json').read_text())
F = {f['id']:copy.deepcopy(f) for f in T['features']}
RECORD = json.loads((REPO/'output/site-plans/porter-subdivision.plat-record.json').read_text())
OUT = ROOT/'eplan'; OUT.mkdir(exist_ok=True)
WIDTH, HEIGHT = 2592,1728
INK=(.1,.13,.16); GREY=(.55,.57,.58); BLUE=(.08,.33,.7); GREEN=(.1,.43,.24); PURPLE=(.43,.16,.56)
checks=[]
def poly(f): return Polygon(f['ring']['coordinates'])
lots=[poly(F[f'l{i}-parcel']) for i in (1,2)]
houses=[poly(F[f'l{i}-proposed-building']) for i in (1,2)]
record_areas=[9598,8008]
for i in (1,2): F[f'l{i}-parcel']['areaSqFt']=record_areas[i-1]
F['subdivision-outer']['areaSqFt']=21825
# Record-backed corridor axis replaces the unsupported snap to a road centreline.
c=RECORD['waterAndSewerConnection']['corridor']; C=tuple(c['eastTerminus'])
u=c['axis']; length=math.hypot(*u); u=(u[0]/length,u[1]/length); n=(u[1],-u[0])
W=(C[0]+u[0]*c['lengthFt'],C[1]+u[1]*c['lengthFt'])
V=min(list(lots[0].exterior.coords)[:-1],key=lambda p:Point(p).distance(lots[1]))
# V is the common rear vertex, not the front party-line corner.
V=min([p for p in list(lots[0].exterior.coords)[:-1] if Point(p).distance(lots[1])<.02],key=lambda p:p[0])
sv=(V[0]-C[0],V[1]-C[1]); sl=math.hypot(*sv); m=(-sv[1]/sl,sv[0]/sl)
if not lots[0].contains(Point(C[0]+m[0]*2,C[1]+m[1]*2)):m=(-m[0],-m[1])
public=Polygon([C,W,(W[0]+20*n[0],W[1]+20*n[1]),(C[0]+20*n[0],C[1]+20*n[1])]).difference(lots[0])
# Only the documented C -> V private segment is represented. The 10-foot strip
# is a design working corridor, not asserted to be the recorded legal width.
private=Polygon([C,V,(V[0]+10*m[0],V[1]+10*m[1]),(C[0]+10*m[0],C[1]+10*m[1])]).intersection(lots[0])
for key in list(F):
    if key.startswith(('public-corridor','private-corridor')) or key in ['wssc-esmt','private-utility-esmt','row-far-0','l1-esmt-0']:
        del F[key]
routes=[]
for k,d in enumerate([1,7,13,19]):
    # Continuous line within the displayed public corridor. The end is its
    # intersection with the recorded Lot 1 boundary, not a tapered triangle.
    a=(W[0]+d*n[0],W[1]+d*n[1]); b=(C[0]+d*n[0],C[1]+d*n[1])
    segment=LineString([a,b]).intersection(public)
    if segment.geom_type=='MultiLineString':segment=max(segment.geoms,key=lambda q:q.length)
    pts=list(segment.coords)
    path=LineString(pts)
    checks.append({'check':f'Public service {k+1} inside public corridor','pass':public.buffer(.01).covers(path)})
    routes.append({'id':f'public-{k+1}','water':k<2,'line':pts,'lot':1 if k%2==0 else 2})
for i in (1,2):
    for water in (True,False):
        old=next(f for f in F.values() if f['id'].startswith(f'l{i}-util-') and (('Water' in f['attributes']['type'])==water))
        target=old['line'][-1]
        # Each private service connects without the prior one-foot gap.
        start=C if i==1 else V
        raw=LineString([start,target]); clipped=raw.intersection(lots[i-1].buffer(.01))
        if clipped.geom_type=='MultiLineString':clipped=max(clipped.geoms,key=lambda q:q.length)
        path=list(clipped.coords)
        old['line']=path
        checks.append({'check':f'Lot {i} {"water" if water else "sewer"} inside own lot','pass':lots[i-1].buffer(.02).covers(clipped)})
        if i==2:
            offset=2 if water else 6
            route=[C,(C[0]+offset*m[0],C[1]+offset*m[1]),(V[0]+offset*m[0],V[1]+offset*m[1]),V]
            routes.append({'id':f'private-{water}','water':water,'line':route,'lot':2})
            checks.append({'check':f'Private {"water" if water else "sewer"} inside Lot 1 working corridor','pass':private.buffer(.02).covers(LineString(route))})

# Replace bounding-box disturbance guesses by a defined, measurable work limit.
# Full-lot phased development, the drawn frontage work, and offsite corridor.
frontage=[poly(f) for f in F.values() if f['id'].startswith('frontage-') and 'ring' in f]
aprons=[poly(F[f'l{i}-apron']) for i in (1,2)]
lod=unary_union(lots+frontage+aprons+[public])
lot_union=unary_union(lots)
frontage_area=unary_union(frontage+aprons).difference(lot_union).area
offsite_area=public.difference(lot_union).area
lod_area=lod.area
# The source source geometry closes within fractions of an inch. Retain record
# areas in legal/site tables and computed polygon area in the work-limit takeoff.
checks.append({'check':'LOD valid and includes both lots/frontage/public utility work','pass':lod.is_valid and all(lod.buffer(.02).covers(g) for g in lots+frontage+aprons+[public])})
distances=[]
for i,(lot,house) in enumerate(zip(lots,houses)):
    ring=list(lot.exterior.coords); idx=1 if i==0 else 0
    ds=[house.distance(LineString([a,b])) for a,b in zip(ring,ring[1:])]
    sides=[ds[0],ds[2]] if i==0 else [ds[1],ds[2]]
    distances.append({'front':ds[idx],'sideMin':min(sides),'sideMax':max(sides),'rear':ds[3] if i==0 else None})
    checks.append({'check':f'Lot {i+1} dwelling within 30-foot front and 8-foot side design lines','pass':ds[idx]>=29.99 and min(sides)>=7.99})

# Correct the leadwalk disconnect: join driveway to the actual 8 x 4 stoop.
for i in (1,2):
    stoop=poly(F[f'l{i}-stoop']); drive=poly(F[f'l{i}-driveway'])
    from shapely.ops import nearest_points
    a,b=nearest_points(stoop,drive)
    walk=LineString([a,b]).buffer(2.5,cap_style=2).union(stoop.intersection(LineString([a,b]).buffer(2.5)))
    walk=walk.intersection(lots[i-1]).difference(houses[i-1])
    if walk.geom_type=='MultiPolygon':walk=max(walk.geoms,key=lambda p:p.area)
    F[f'l{i}-walk']['ring']['coordinates']=list(walk.exterior.coords)
    checks.append({'check':f'Lot {i} leadwalk reaches stoop and driveway','pass':walk.distance(stoop)<.02 and walk.distance(drive)<.02})

# Recompute the areas used by the existing rainfall calculation, with a
# polygon union so overlapping pavement is not counted twice.
drain=[]
for i,area in enumerate(record_areas,1):
    imp=unary_union([houses[i-1]]+[poly(F[f'l{i}-{s}']) for s in ['driveway','walk','stoop']]).intersection(lots[i-1]).area
    pct=100*imp/area; comp=(.95*imp+.25*(area-imp))/area; ac=area/43560
    rv=.05+.009*pct; vol=rv*area/12
    drain.append({'lot':i,'area':area,'roof':1196,'impervious':imp,'percent':pct,'Cpre':.25,'Cpost':comp,'I10':6.71,'tc':5,'Qpre':.25*6.71*ac,'Qpost':comp*6.71*ac,'WQv':vol})

def text(p,x,y,s,size=11,bold=False,color=INK):
    p.insert_text((x,y),str(s),fontname='hebo' if bold else 'helv',fontsize=size,color=color)
def para(p,x,y,w,s,size=11):
    # Measured wrapping; no clipped/ellipsis mandatory notes.
    font=pdf.Font('helv'); line=''; lines=[]
    for word in s.split():
        trial=(line+' '+word).strip()
        if font.text_length(trial,fontsize=size)>w:
            lines.append(line);line=word
        else:line=trial
    if line:lines.append(line)
    for line in lines:text(p,x,y,line,size);y+=size*1.4
    return y+8
def heading(p,x,y,s,w=510):
    p.draw_rect(pdf.Rect(x,y-18,x+w,y+8),color=None,fill=(.91,.94,.95));text(p,x+8,y,s,13,True);return y+30
def table(p,x,y,width,headers,rows):
    widths=[width/len(headers)]*len(headers)
    for ri,row in enumerate([headers]+rows):
        h=30
        p.draw_rect(pdf.Rect(x,y,x+width,y+h),color=(.7,.73,.75),fill=(.93,.95,.96) if ri==0 else None,width=.5)
        xx=x
        for cell,cw in zip(row,widths):
            size=10 if len(str(cell))<26 else 8.5
            text(p,xx+8,y+19,cell,size,ri==0);xx+=cw
        y+=h
    return y+16
def frame(doc,number,title):
    p=doc.new_page(width=WIDTH,height=HEIGHT)
    p.draw_rect(pdf.Rect(22,22,WIDTH-22,HEIGHT-22),color=INK,width=1)
    text(p,42,58,'PORTER SUBDIVISION | LOTS 1 & 2',23,True)
    text(p,42,84,'1005 & 1009 ROLLINS AVENUE, PRINCE GEORGE\'S COUNTY, MARYLAND',13)
    text(p,42,HEIGHT-44,f'{number}  |  {title}',15,True)
    text(p,1550,HEIGHT-44,'REVISION 1 | 09 SEPTEMBER 2026 | PROFESSIONAL REVIEW',11)
    p.draw_line((40,HEIGHT-70),(WIDTH-40,HEIGHT-70),color=INK)
    return p
def draw_geo(p,geom,tr,color=INK,width=1,fill=None,dashes=None):
    if geom.is_empty:return
    if hasattr(geom,'geoms'):
        for g in geom.geoms:draw_geo(p,g,tr,color,width,fill,dashes)
        return
    coords=list(geom.exterior.coords) if geom.geom_type=='Polygon' else list(geom.coords)
    if len(coords)<2:return
    sh=p.new_shape();sh.draw_polyline([tr(q) for q in coords]);sh.finish(color=color,width=width,fill=fill,closePath=geom.geom_type=='Polygon',dashes=dashes);sh.commit()
def plot(p,rect,esc=False):
    # Exact plotted 1"=20' scale, never fit-to-page while retaining the label.
    scale=3.6
    extent=unary_union(lots+[public]).bounds
    cx=(extent[0]+extent[2])/2;cy=(extent[1]+extent[3])/2
    px=(rect.x0+rect.x1)/2;py=(rect.y0+rect.y1)/2
    tr=lambda q:(px+(q[0]-cx)*scale,py-(q[1]-cy)*scale)
    clip=box(cx-(rect.width/2)/scale,cy-(rect.height/2)/scale,cx+(rect.width/2)/scale,cy+(rect.height/2)/scale)
    for a in T.get('adjacentParcels',[]):
        g=Polygon(a['ring']['coordinates']);draw_geo(p,g.intersection(clip),tr,(.78,.8,.81),.5)
    for f in F.values():
        if f['kind']=='Contour':
            line=LineString([q[:2] for q in f['line']]).intersection(clip);draw_geo(p,line,tr,(.63,.48,.3),.55,dashes='[5 4]')
            if not line.is_empty and line.geom_type=='LineString':
                q=line.interpolate(.5,normalized=True);x,y=tr(q.coords[0]);text(p,x+3,y-3,int(f.get('attributes',{}).get('elevationFt',0)),7,color=(.55,.4,.25))
    for st in T.get('streets',[]):
        for path in st.get('paths',[]):
            if len(path)>1:draw_geo(p,LineString([q[:2] for q in path]).intersection(clip),tr,GREY,.6,dashes='[12 4 2 4]')
    for f in F.values():
        if f['kind']=='Pavement':draw_geo(p,poly(f),tr,(.4,.42,.43),.75,(.86,.87,.88))
        if f['id'].endswith('esmt-plat-frontage'):draw_geo(p,poly(f),tr,PURPLE,.8,dashes='[10 3 2 3]')
    for lot,house in zip(lots,houses):
        draw_geo(p,lot,tr,INK,1.7)
        draw_geo(p,house,tr,(.5,.18,.14),1.3,(.98,.96,.94))
    # Easement working linework follows source segment; legal width not inferred.
    draw_geo(p,public,tr,PURPLE,1,dashes='[10 3 2 3]')
    draw_geo(p,LineString([C,V]),tr,PURPLE,1.3,dashes='[10 3 2 3]')
    for route in routes:draw_geo(p,LineString(route['line']),tr,BLUE if route['water'] else GREEN,.85,dashes='[8 3]' if route['water'] else '[12 3 2 3]')
    for f in F.values():
        if f['kind']=='Utility' and f['id'].startswith(('l1-','l2-')):draw_geo(p,LineString(f['line']),tr,BLUE if 'Water' in f['attributes']['type'] else GREEN,1,dashes='[8 3]')
    for i,house in enumerate(houses,1):
        q=house.centroid;x,y=tr(q.coords[0]);text(p,x-50,y-8,f'LOT {i} | {1001+i*4} ROLLINS',9,True);text(p,x-40,y+8,'46\' x 26\' | 1,196 SF',9)
        lot=lots[i-1];pr=lot.representative_point();x,y=tr(pr.coords[0]);
        # Dimensional schedule is outside the building to avoid text collisions.
        front=list(lot.exterior.coords)[1 if i==1 else 0:3 if i==1 else 2]
        mid=LineString(front).interpolate(.5,normalized=True);x,y=tr(mid.coords[0]);text(p,x+20,y,f'LOT {i}: {record_areas[i-1]:,} SF',10,True)
        dw=next(f for f in F.values() if f['kind']=='SWMPractice' and f['id'].startswith(f'l{i}-'))
        draw_geo(p,poly(dw),tr,GREEN,1.2,dashes='[4 2]');dc=poly(dw).centroid;x,y=tr(dc.coords[0]);text(p,x-24,y,f'DW-{i}',10,True,color=GREEN)
    x,y=tr(C);text(p,x-140,y-24,"20' WSSC EASEMENT",10,True,color=PURPLE)
    x,y=tr(LineString([C,V]).interpolate(.55,normalized=True).coords[0]);text(p,x-135,y+14,'PRIVATE UTILITY ESMT',9,color=PURPLE)
    text(p,rect.x1-185,rect.y0+90,'ROLLINS AVENUE',12,True)
    text(p,rect.x0+45,rect.y0+65,'MODUPEOLA WAY',10)
    # BRL dimensions are measured to actual footprint, not copied from minima.
    for i,lot in enumerate(lots,1):
        env=poly(F[f'l{i}-buildable-envelope']);draw_geo(p,env,tr,GREY,.7,dashes='[7 4]')
    if esc:
        draw_geo(p,lod,tr,(.75,.12,.12),1.5,dashes='[12 4 2 4]')
        # Perimeter controls placed inside each lot, except access openings.
        for i,lot in enumerate(lots,1):
            ring=list(lot.exterior.coords);fi=1 if i==1 else 0
            back_edges=[LineString([a,b]) for k,(a,b) in enumerate(zip(ring,ring[1:])) if k!=fi]
            # Offset toward lot interior by clipping a 2-foot inset boundary.
            inner=lot.buffer(-2).boundary
            front=LineString([ring[fi],ring[fi+1]]).buffer(8)
            draw_geo(p,inner.difference(front),tr,(.8,.25,.08),1.1,dashes='[3 3]')
            drive=poly(F[f'l{i}-driveway']);draw_geo(p,drive,tr,(.8,.25,.08),1.3,dashes='[2 2]')
            q=drive.centroid;x,y=tr(q.coords[0]);text(p,x-25,y-10,f'SCE-{i}',10,True)
        text(p,rect.x0+40,rect.y1-15,f'LOD: {math.ceil(lod_area):,} SF TOTAL PROPOSED DISTURBANCE',12,True,color=(.75,.12,.12))
    # Scale bar, north arrow and coordinate basis outside the geometry.
    bx,by=rect.x0+35,rect.y1+25
    for i in range(5):
        x=bx+i*72;p.draw_line((x,by-5),(x,by+5),color=INK);text(p,x-5,by+20,str(i*20),9)
    p.draw_line((bx,by),(bx+288,by),color=INK);text(p,bx,by+40,'GRAPHIC SCALE 1" = 20\' (PRINT AT 100%)',10,True)
    text(p,rect.x1-180,rect.y1+40,'NAD83 / NAVD88 FEET',10)
    nx,ny=rect.x1-35,rect.y0+20;p.draw_line((nx,ny+45),(nx,ny+8),color=INK,width=1.5);p.draw_polyline([(nx-6,ny+18),(nx,ny+8),(nx+6,ny+18)],color=INK);text(p,nx-4,ny,'N',12,True)
    return tr

doc=pdf.open()
p=frame(doc,'C-001','SITE, UTILITIES AND DIMENSIONAL PLAN')
plot(p,pdf.Rect(60,170,1780,1460))
x,y,w=1840,150,680
y=heading(p,x,y,'PROJECT AND DRAWING BASIS',w)
for s in [
    'Two detached dwellings. Boundary control: recorded Porter Subdivision plat, PM 231 / 50. Existing contours: 2-foot interval, NAVD88. Proposed buildings retain the supplied BEST-BACKUP footprint and siting.',
    'Recorded areas: Lot 1 9,598 SF; Lot 2 8,008 SF; net lots 17,606 SF; public dedication 4,219 SF; gross tract 21,825 SF.',
    'Tax Map 73, Grid B3; former Parcel 326. Preliminary Plan 4-06111; Record File 5-09121. Zoning: RSF-65 (R-55 at plat recording).',
]:y=para(p,x,y,w,s)
y=heading(p,x,y+12,'MEASURED DWELLING CLEARANCES',w)
rows=[]
for i,d in enumerate(distances,1):rows.append([f'Lot {i}',f'{d["front"]:.2f} ft',f'{d["sideMin"]:.2f} / {d["sideMax"]:.2f} ft',f'{d["rear"]:.2f} ft' if d['rear'] is not None else 'Triangular lot'])
y=table(p,x,y,w,['LOT','FRONT','SIDES','REAR'],rows)
y=para(p,x,y,w,'Design lines: front 30 ft; sides 8 ft; Lot 1 rear 20 ft. Lot 2 uses the applicant-directed triangular-lot side-yard treatment. The table reports actual geometry and does not represent an agency determination.')
y=heading(p,x,y+10,'LOT COVERAGE',w)
y=table(p,x,y,w,['LOT','DWELLING','FOOTPRINT / LOT'],[[f'Lot {i}', '1,196 SF',f'{1196/a*100:.2f}%'] for i,a in enumerate(record_areas,1)])
y=para(p,x,y,w,'35% maximum shown in the project zoning criteria. Ratios above are dwelling footprint only. Site paving is accounted for separately in the drainage calculations.')
y=heading(p,x,y+10,'UTILITY CONNECTIONS',w)
y=para(p,x,y,w,'Both lots: water and sanitary connections toward the existing 8-inch mains in Modupeola Way, through the 20-foot WSSC corridor on Lot 13. Private utility segment runs from the Lot 1 / 12 / 13 corner toward the Lot 1 / 2 / 12 corner. The unsupported upper private-easement segment is removed.')
y=para(p,x,y,w,'Public corridor alignment uses the transcribed S 84-00-24 W line, 33.45 ft. Connections at the public/private junction are diagrammatic; final WSSC fitting, separation, depth and tie-in details govern. Private legal width is per the easement instrument, not inferred from the sketch.')
y=heading(p,x,y+10,'LEGEND',w)
for color,label,dash in [(INK,'Recorded lot line',None),(GREY,'Building restriction line','[7 4]'),(PURPLE,'Utility easement','[10 3 2 3]'),(BLUE,'Water house connection','[8 3]'),(GREEN,'Sanitary house connection','[12 3 2 3]')]:
    p.draw_line((x,y),(x+60,y),color=color,width=1,dashes=dash);text(p,x+75,y+4,label);y+=24
y=para(p,x,y+15,w,'DW-1 / DW-2 identify reserved stormwater locations. The staff report describes infiltration drywells under Concept 41230-2006-00; final approved sizing and outlet details are required before construction.')

p=frame(doc,'C-002','DISTURBANCE AND EROSION-CONTROL LAYOUT')
plot(p,pdf.Rect(60,170,1780,1460),True)
x,y,w=1840,150,680
y=heading(p,x,y,'DISTURBANCE TAKEOFF',w)
y=table(p,x,y,w,['WORK AREA','POLYGON AREA'],[['Lot 1',f'{lots[0].area:,.2f} SF'],['Lot 2',f'{lots[1].area:,.2f} SF'],['Frontage outside net lots',f'{frontage_area:,.2f} SF'],['Public utility corridor',f'{offsite_area:,.2f} SF'],['Total union (rounded up)',f'{math.ceil(lod_area):,} SF']])
y=para(p,x,y,w,'LOD includes the full two-lot work area, shown frontage construction and the offsite utility corridor. Areas are computed from a polygon union, with no overlap double-counting. Recorded lot areas govern property data; polygon areas govern this takeoff.')
y=heading(p,x,y+12,'CONSTRUCTION SEQUENCE',w)
sequence=['Obtain applicable permits and approved construction documents; hold the preconstruction meeting.','Locate utilities before excavation. Install perimeter controls inside the work limits and protect adjoining land.','Establish stabilized access at the proposed driveways (SCE-1 / SCE-2); maintain the public pedestrian route.','Stage Lot 1 then Lot 2; expose only the area under active construction. Keep stockpiles and washout within controlled work areas.','Construct foundations and utility services; protect reserved drywell locations from compaction and sediment.','Complete permanent drainage facilities after contributing areas are stabilized; complete frontage and final landscaping.','Remove temporary controls only after permanent stabilization and inspector authorization.']
for i,s in enumerate(sequence,1):y=para(p,x,y,w,f'{i}. {s}',11)
y=heading(p,x,y+10,'STANDARD STABILIZATION NOTE',w)
notes=(REPO/'packages/spatial-engine/src/site-plan/required-notes.ts').read_text()
stable=notes.split('export const MD_STANDARD_STABILIZATION_NOTE')[1].split('source:')[0].split('text:')[1]
stable=''.join(re.findall(r"'([^']*)'",stable))
y=para(p,x,y,w,stable,11)
y=heading(p,x,y+10,'CONTROL DETAILS AND LIMITS',w)
y=para(p,x,y,w,'Orange dashed perimeter line: proposed sediment barrier, placed inside lot limits. Final barrier type, lengths, storage and tributary area must follow the approved sediment-control design. SCE footprints use the driveway work areas; extend stabilized access as required by the approving authority. This layout does not claim erosion-control approval.')

p=frame(doc,'C-003','RECORD CONDITIONS, DRAINAGE CALCULATIONS AND DESIGN CRITERIA')
columns=[(60,770),(900,770),(1740,770)]
x,w=columns[0];y=155
y=heading(p,x,y,'RECORDED PLAT CONDITIONS - COMPLETE',w)
for i,s in enumerate(RECORD['notes'],1):y=para(p,x,y,w,f'{i}. {s}',13)
y=heading(p,x,y+20,'ADJOINERS OF RECORD',w)
for a in RECORD['adjoiners']:y=para(p,x,y,w,f'{a["boundary"].upper()}: {a["label"]} - {a["reference"]}',12)
y=heading(p,x,y+20,'BOUNDARY CONTROL',w)
y=para(p,x,y,w,'The recorded plat supplies the boundary survey/control for this drawing. Original owner/surveyor signatures apply to that recorded instrument. No new field survey is represented. The plan does not convert record boundary coordinates into vertical grades.',12)
y=table(p,x,y,w,['POINT','EASTING NAD83','NORTHING NAD83'],[[a['id'],f'{a["easting"]:.4f}',f'{a["northing"]:.4f}'] for a in RECORD['monuments']])

x,w=columns[1];y=155
y=heading(p,x,y,'LOT DRAINAGE CALCULATIONS',w)
y=table(p,x,y,w,['PARAMETER','LOT 1','LOT 2'],[
    ['Area (SF)',*['%d'%d['area'] for d in drain]],['Roof (SF)','1,196','1,196'],
    ['Impervious union (SF)',*[f'{d["impervious"]:.2f}' for d in drain]],
    ['Impervious (%)',*[f'{d["percent"]:.2f}' for d in drain]],
    ['Composite C pre','0.250','0.250'],['Composite C post',*[f'{d["Cpost"]:.3f}' for d in drain]],
    ['Tc / I10','5 min / 6.71 in/hr','5 min / 6.71 in/hr'],
    ['Q10 pre (CFS)',*[f'{d["Qpre"]:.3f}' for d in drain]],['Q10 post (CFS)',*[f'{d["Qpost"]:.3f}' for d in drain]],
    ['WQv screening (CF)',*[f'{d["WQv"]:.1f}' for d in drain]],
])
for s in ['Q = C i A; A in acres. Weighted C uses roof/paving 0.95 and pervious area 0.25. Impervious areas use geometric unions of the dwelling, driveway, stoop and corrected leadwalk.',
    'Rainfall: NOAA Atlas 14, Volume 2 Version 3, 38.8752 N / 76.9019 W; 10-year, 5-minute intensity 6.71 in/hr. Tc is the existing model\'s five-minute minimum; final drainage design must validate the actual flow path and surface classification.',
    'WQv = P Rv A / 12; P = 1.0 inch; Rv = 0.05 + 0.009 I (I in percent). This is a screening water-quality volume, not proof of current ESDv, recharge or channel-protection compliance.',
    'Frontage paving is excluded from lot catchments and listed in the disturbance takeoff. Final drainage analysis must include its receiving system and all upstream tributary areas. No outlet capacity, infiltration rate, groundwater level or utility invert has been invented.']:
    y=para(p,x,y,w,s,12)
y=heading(p,x,y+15,'GRADING AND DRAINAGE CRITERIA',w)
for s in ['Design positive drainage away from foundations and protect adjoining land. Show finished-floor, corner, garage, critical spot and facility elevations in the final engineering design.',
    'Coordinate driveway profiles with garage slabs and existing curb grades. County site/road checklist: driveway 1% minimum / 12.5% maximum; provide compliant accessible pedestrian cross slopes.',
    'Keep utility trenching, trees, building projections and drywell construction clear of each other. Protect the proposed drywell receiving areas during construction.']:
    y=para(p,x,y,w,s,12)

x,w=columns[2];y=155
y=heading(p,x,y,'ENVIRONMENTAL RECORD',w)
# Historical findings are attributed rather than passed off as current approvals.
for s in ['M-NCPPC staff report for Preliminary Plan 4-06111 documents NRI/116/06 (September 21, 2006), a woodland exemption issued June 7, 2007, and Concept 41230-2006-00 (May 21, 2007) proposing drywells on both lots.',
    'That review reports no streams, wetlands, 100-year floodplain or Marlboro clay on site and identifies Adelphia, Sassafras and Westphalia soil series. These are historical agency findings, not new onsite measurements. The exemption letter and current concept documentation remain application attachments.',
    'Source: M-NCPPC, Porter Property staff report, 4-06111, pages 2-3. A copy is included in the source folder.']:
    y=para(p,x,y,w,s,12)
soil_path=ROOT/'sources/porter-site-soils.json'
if soil_path.exists():
    payload=json.loads(soil_path.read_text()); soil_rows=payload.get('Table',[])
    if soil_rows:
        y=heading(p,x,y+12,'PARCEL-INTERSECTION SOIL MAPPING',w)
        for row in soil_rows:y=para(p,x,y,w,f'{row[0]}: {row[1]}; HSG {row[3]}; {row[4]}; hydric {row[2]}; K {row[5]}.',11)
        y=para(p,x,y,w,'USDA NRCS Soil Data Access: map units intersecting the recorded tract, retrieved September 9, 2026. Mapped components do not establish an infiltration test or groundwater elevation.',11)
y=heading(p,x,y+12,'BUILDING DESIGN COORDINATION',w)
y=para(p,x,y,w,'Kingsworth drawing 260811 provides a 36-foot main house with an optional 10-foot ONE-CAR garage and a nominal 26-foot depth. The 46 x 26 site footprint includes that garage. A two-car garage is not represented by the source drawing.',12)
y=para(p,x,y,w,'The supplied architectural source contains a basement foundation and rear areaway. The actual basement/areaway option, floor heights and wall sections must be coordinated with the full building design. This civil revision does not purport to supply missing architectural or structural sheets.',12)
y=heading(p,x,y+12,'PROFESSIONAL CERTIFICATION',w)
y=para(p,x,y,w,'I hereby certify that these documents were prepared or approved by me, and that I am a duly licensed professional engineer under the laws of the State of Maryland.',12)
for label in ['SIGNATURE / DATE','LICENSE NUMBER / EXPIRATION','OWNER / APPLICANT / CONTACT']:
    y+=38;p.draw_line((x,y),(x+w,y),color=GREY);text(p,x,y+15,label,9)

p=frame(doc,'C-004','COUNTY DETAILS AND UTILITY REFERENCE')
text(p,60,150,'DETAILS: USE THE COUNTY STANDARD; REPRODUCED DETAILS ARE NOT TO SCALE',14,True)
for image_name,rect in [('dpwt-300-01-curb-and-gutter.png',pdf.Rect(60,210,800,1450)),('dpwt-300-07-sidewalk-ramp.png',pdf.Rect(870,210,1610,1450))]:
    path=REPO/'packages/spatial-engine/assets/details'/image_name
    p.insert_image(rect,filename=str(path),keep_proportion=True)
reference=pdf.open(REPO/'existing site plans/ScanRollions SW Easemenmt.pdf')
p.show_pdf_page(pdf.Rect(1690,240,2500,1160),reference,1,keep_proportion=True)
para(p,1690,1220,800,'WATER AND SEWER CONNECTION SKETCH - SOURCE REFERENCE. Page 2 of the supplied WSSC connection document. Reproduced without converting its unlabelled private width into a legal dimension. See C-001 for the corrected working route.',13)
para(p,1690,1360,800,'GENERAL COORDINATION: the recorded plat condition governs driveway arrangement. Separate aprons as drawn remain subject to DPW&T determination. The frontage walk must meet the applicable county standard or approved modification.',13)

target=REPO/'output/site-plans/porter-subdivision-permit-set.CORRECTED.pdf'
doc.set_metadata({'title':'Porter Subdivision - Corrected civil permit drawings','author':'Kealee','subject':'Record-based civil revision; professional review required'})
doc.save(target,garbage=4,deflate=True)
for i,p in enumerate(doc):
    single=pdf.open();single.insert_pdf(doc,from_page=i,to_page=i)
    single.save(OUT/f'C-{i+1:03d} - { ["Site and Utilities","Disturbance and Erosion Control","Notes and Calculations","Details and Utility Reference"][i]}.pdf')
    p.get_pixmap(matrix=pdf.Matrix(.65,.65)).save(str(ROOT/f'preview-{i+1}.png'))
data={'sourceBestBackupSHA256':hashlib.sha256(BASE.read_bytes()).hexdigest(),'status':'CORRECTED_DRAWINGS_PROFESSIONAL_REVIEW_REQUIRED','pages':len(doc),'recordAreas':record_areas,'disturbanceUnionSqFt':lod_area,'clearances':distances,'drainage':drain,'geometryChecks':checks,'remaining':['Professional signatures and certification','Final vertical grading, utility/infiltration design values not present in records','Current approval attachments and private easement legal instrument','Lot 2 zoning interpretation and DPW&T driveway/sidewalk determination','Complete coordinated architectural and structural building set']}
(ROOT/'verification.json').write_text(json.dumps(data,indent=2)+'\n')
(ROOT/'corrected-features.json').write_text(json.dumps({'features':list(F.values()),'utilityRoutes':routes,'lodWkt':lod.wkt,'publicCorridorWkt':public.wkt,'privateWorkingCorridorWkt':private.wkt},indent=2)+'\n')
assert len(doc)==4
assert all(c['pass'] for c in checks),checks
print(target);print(json.dumps(data,indent=2))
