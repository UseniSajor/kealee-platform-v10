"""Revise the user-selected Rollins PDF; derive quantities from its own vectors.
Run with Python, PyMuPDF and Shapely. Never edits the selected baseline.
"""
from pathlib import Path
import hashlib,json,math,re,shutil,csv
import pymupdf as pdf
from shapely.geometry import Polygon,LineString,Point
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parent; REPO=ROOT.parents[2]
SOURCE=REPO/'output/site-plans/rollins-submission-review/porter-BEST-BACKUP.REVIEW.pdf'
HASH='d9b0e033c4822b35df5ae31a5cc65dc2a7cae056db395fcdc08aad85b81cdb94'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==HASH,'Selected baseline changed; re-review before rebuilding.'
record=json.loads((REPO/'output/site-plans/porter-subdivision.plat-record.json').read_text())
doc=pdf.open(SOURCE);p=doc[0];drawings=p.get_drawings();SCALE=3.6
for a in list(p.annots() or []):p.delete_annot(a)
def shape(d):
 pts=[]
 for item in d['items']:
  kind=item[0]
  if kind=='qu':
   q=item[1];pts.extend([tuple(q.ul),tuple(q.ur),tuple(q.lr),tuple(q.ll)])
  elif kind=='re':
   r=item[1];pts.extend([tuple(r.tl),tuple(r.tr),tuple(r.br),tuple(r.bl)])
  elif kind=='l':
   if not pts:pts.append(tuple(item[1]))
   pts.append(tuple(item[2]))
  elif kind=='c':
   a,b,c,d=item[1:]
   if not pts:pts.append(tuple(a))
   for k in range(1,25):
    t=k/24;v=1-t;pts.append((v**3*a.x+3*v*v*t*b.x+3*v*t*t*c.x+t**3*d.x,v**3*a.y+3*v*v*t*b.y+3*v*t*t*c.y+t**3*d.y))
 g=Polygon(pts)
 assert g.is_valid and g.area>0
 return g
lots=[shape(drawings[i]) for i in [421,422]]
houses=[shape(drawings[i]) for i in [6989,7035]]
assert all(abs(g.area/SCALE**2-1196)<.2 for g in houses)
assert abs(LineString(list(lots[0].exterior.coords)[2:4]).length/SCALE-65)<.1
# Classify closed paving paths by the original renderer's fill colour.
pavements=[];public=None
for d in drawings:
 if d['rect'].x1>=2000 or d['rect'].y1>=1200 or not d['fill']:continue
 col=tuple(round(v,3) for v in d['fill'])
 if col in [(0.725,0.725,0.725),(.937,.937,.937),(.886,.886,.886),(.827,.827,.827),(.867,.867,.867)]:
  try:pavements.append(shape(d))
  except (AssertionError,ValueError):pass
 if col==(.416,.106,.604) and d['rect'].x0<600:public=shape(d)
assert public is not None
# Include only actual footprint-bearing pavement paths, never the gray hatches.
lot_union=unary_union(lots);pave=unary_union(pavements)
lod=unary_union(lots+pavements+[public]);areas=[9598,8008]
measured=[]
for i,(lot,house) in enumerate(zip(lots,houses)):
 ring=list(lot.exterior.coords);edges=[LineString([a,b]) for a,b in zip(ring,ring[1:])]
 front=2 if i==0 else 0
 distances=[house.distance(e)/SCALE for e in edges]
 sides=[distances[1],distances[3]] if i==0 else distances[1:]
 measured.append({'lot':i+1,'recordAreaSF':areas[i],'computedAreaSF':lot.area/SCALE**2,'footprintSF':1196,'footprintCoveragePct':1196/areas[i]*100,'frontFt':distances[front],'sideFt':sides,'rearFt':distances[0] if i==0 else None})
# Text-only correction uses actual text quads so diagonal linework survives.
replacements=[]
for block in p.get_text('dict')['blocks']:
 for line in block.get('lines',[]):
  for span in line['spans']:
   if span['bbox'][0]>=2050:continue
   old=span['text'];new=old
   for a,b in [('79°29\'04','79°29\'14'),('10°30\'43','10°30\'46'),("222.28'","222.27'"),('134.65','134.64'),('8,009 SQ FT','8,008 SQ FT')]:new=new.replace(a,b)
   if old.startswith('FRONTAGE 134.65'):new=''
   if new!=old:
    p.add_redact_annot(pdf.recover_quad(line['dir'],span),fill=False)
    if new:replacements.append((span,line['dir'],new))
p.apply_redactions(images=0,graphics=0)
for span,direction,new in replacements:
 origin=pdf.Point(span['origin']);angle=-math.degrees(math.atan2(direction[1],direction[0]))
 p.insert_text(origin,new,fontsize=span['size'],fontname='helv',color=(.15,.15,.15),morph=(origin,pdf.Matrix(angle)))
# Replace the complete sidebar so no hidden obsolete area/approval text remains.
p.add_redact_annot(pdf.Rect(2050,18,2574,1709),fill=(1,1,1))
p.apply_redactions(images=0,graphics=2)
INK=(.12,.15,.18); GREY=(.45,.48,.5); RED=(.7,.14,.14)
text_bounds=[]
def text(page,x,y,s,size=11,bold=False):
 page.insert_text((x,y),s,fontname='hebo' if bold else 'helv',fontsize=size,color=INK)
def para(page,x,y,w,s,size=11):
 font=pdf.Font('helv');lines=[];line=''
 for word in s.split():
  trial=(line+' '+word).strip()
  if font.text_length(trial,fontsize=size)>w:lines.append(line);line=word
  else:line=trial
 if line:lines.append(line)
 assert y+len(lines)*size*1.32<page.rect.height-30,(s[:60],y)
 for line in lines:text(page,x,y,line,size);y+=size*1.32
 return y+7

def heading(page,x,y,w,title):
 page.draw_rect(pdf.Rect(x,y-15,x+w,y+7),color=None,fill=(.92,.94,.95));text(page,x+6,y,title,12,True);return y+27

def table(page,x,y,width,headers,rows):
 columns=len(headers);cw=width/columns
 for ri,row in enumerate([headers]+rows):
  page.draw_rect(pdf.Rect(x,y,x+width,y+25),color=(.7,.73,.75),width=.4)
  for j,value in enumerate(row):text(page,x+5+j*cw,y+16,str(value),9,ri==0)
  y+=25
 return y+12

def note_source(name):
 s=(REPO/'packages/spatial-engine/src/site-plan/required-notes.ts').read_text().split('export const '+name)[1].split('source:')[0].split('text:')[1]
 return ''.join(m[0] or m[1] for m in re.findall(r"'([^']*)'|\"([^\"]*)\"",s))

# Defined work-limit geometry and takeoff are a proposed full-lot work scope.
def draw_geom(page,g):
 if hasattr(g,'geoms'):
  for q in g.geoms:draw_geom(page,q)
 else:page.draw_polyline([pdf.Point(a) for a in g.exterior.coords],color=RED,width=1,dashes='[10 4 2 4]',closePath=True)
draw_geom(p,lod)
text(p,650,1080,f'PROPOSED LIMIT OF DISTURBANCE: {math.ceil(lod.area/SCALE**2):,} SF',12,True)
text(p,650,1100,'LOD - - . - -  |  FULL-LOT DEVELOPMENT AND DEPICTED FRONTAGE / UTILITY WORK',10)
text(p,1770,95,'H: NAD83   V: NAVD88 (FT)',10)
text(p,1770,110,'EXISTING CONTOUR INTERVAL: 2 FT',10)
# Reproduce only the plat vicinity inset; it contains no surveyor signatures.
plat=pdf.open(REPO/'existing site plans/Rollins Ave lots.pdf');plat[0].set_rotation(270)
vp=plat[0].get_pixmap(matrix=pdf.Matrix(3,3),clip=pdf.Rect(635,40,760,171))
vp.save(ROOT/'sources/record-vicinity.png')
p.insert_image(pdf.Rect(65,85,340,373),pixmap=vp)
text(p,65,65,'VICINITY MAP - RECORD REFERENCE',12,True)
text(p,65,393,'NOT TO SCALE',9)

x,y,w=2070,55,482
text(p,x,y,'PORTER SUBDIVISION - LOTS 1 & 2',18,True);y+=25
for s in ['1005 & 1009 ROLLINS AVENUE','PRINCE GEORGE\'S COUNTY, MARYLAND','C-001  |  SITE DEVELOPMENT / FINE GRADING','REVISION 1 - 09 SEPTEMBER 2026','PRELIMINARY - NOT FOR CONSTRUCTION']:
 text(p,x,y,s,11,True);y+=19
y+=12
y=heading(p,x,y,w,'SITE DATA - RECORDED AREAS')
y=table(p,x,y,w,['ITEM','LOT 1','LOT 2'],[['Recorded lot area','9,598 SF','8,008 SF'],['Frontage','65.00 ft','134.64 ft'],['Dwelling footprint','1,196 SF','1,196 SF'],['Dwelling / lot','12.46%','14.94%']])
y=para(p,x,y,w,'Net lots: 17,606 SF. Public dedication: 4,219 SF. Gross recorded tract: 21,825 SF. PM 231 / 50; Tax Map 73, Grid B3. Zoning RSF-65. Footprint ratios exclude other structures and projections.')
y=heading(p,x,y,w,'MEASURED FOOTPRINT CLEARANCES')
y=table(p,x,y,w,['YARD','LOT 1','LOT 2'],[['Front',f'{measured[0]["frontFt"]:.2f} ft',f'{measured[1]["frontFt"]:.2f} ft'],['Sides',' / '.join(f'{q:.2f}' for q in measured[0]['sideFt']),' / '.join(f'{q:.2f}' for q in measured[1]['sideFt'])],['Rear',f'{measured[0]["rearFt"]:.2f} ft','See yard review']])
y=para(p,x,y,w,'Design criteria: front 30 ft; side 8 ft; Lot 1 rear 20 ft. Lot 2 triangular-yard classification requires zoning determination. Dimensions apply to the depicted dwelling footprint; coordinate all building projections.')
y=heading(p,x,y,w,'NOTES OF RECORD - COMPLETE')
for i,n in enumerate(record['notes'],1):y=para(p,x,y,w,f'{i}. {n}',10)
y=heading(p,x,y,w,'GENERAL AND CONSTRUCTION NOTES')
notes=[
 'Boundary reference: Porter Subdivision, Lots 1 and 2, Plat Book PM 231, page 50. Horizontal basis NAD83. Existing contour interval 2 ft, vertical datum NAVD88.',
 'Secure applicable permits and approved construction documents before work. Locate utilities and verify utility depths before excavation. Coordinate finished floors, site grades and service inverts with the approved engineering design.',
 'Install approved construction access and sediment controls before clearing. Maintain controls during construction. Protect stormwater facility areas from sediment and compaction; stabilize contributing areas before placing facilities in service.',
 'Complete permanent stabilization and frontage work; remove temporary controls after inspector authorization. Tie frontage construction to existing line and grade.',
 'Water and sanitary routing is preliminary. Coordinate WSSC connections, recorded easement limits, service separation and utility profiles. County details and the source connection sketch appear on this sheet.',
 'The 46 x 26 dwelling footprint includes the optional 10-foot one-car garage. Coordinate the Kingsworth basement, rear areaway, veneer and other projections with the selected building design.',
]
for i,n in enumerate(notes,1):y=para(p,x,y,w,f'{i}. {n}',10)
y=heading(p,x,y,w,'STANDARD STABILIZATION NOTE')
y=para(p,x,y,w,note_source('MD_STANDARD_STABILIZATION_NOTE'),10)
y=heading(p,x,y,w,'DISTURBANCE AND SUPPORTING INFORMATION')
y=para(p,x,y,w,f'Proposed work-limit union: {math.ceil(lod.area/SCALE**2):,} SF. Lot 1: {lots[0].area/SCALE**2:,.1f} SF; Lot 2: {lots[1].area/SCALE**2:,.1f} SF. Work-limit takeoff includes depicted offsite work; coordinate final limits with approved ESC, utility, frontage and conservation documents.',10)
y=para(p,x,y,w,'Supporting dossier: recorded conditions and adjoiners, soils data, source references, quantity basis and the application completion worksheet. Stormwater facility labels show preliminary locations and footprints.',10)
y=heading(p,x,y,w,'RESPONSIBLE PROFESSIONAL / APPLICANT')
for label in ['OWNER / APPLICANT / CONTACT','DESIGNER / ADDRESS / PHONE','CHECKER / DATE','PROFESSIONAL SIGNATURE / SEAL / LICENSE / EXPIRATION']:
 p.draw_line((x,y+11),(x+w,y+11),color=GREY,width=.5);text(p,x,y+24,label,8);y+=44
assert y<1695,y
# Additional technical blocks occupy the unused lower plan area.
bx,by,bw=1050,1330,930
p.draw_rect(pdf.Rect(1035,1300,2020,1698),color=None,fill=(1,1,1))
by=heading(p,bx,by,bw,'SOILS - AeB: ADELPHIA-HOLMDEL-URBAN LAND COMPLEX, 0 TO 5 PERCENT SLOPES')
by=table(p,bx,by,bw,['COMPONENT HSG','DRAINAGE CLASS','HYDRIC','K FACTOR'],[['B/D','Somewhat poorly drained','No','0.24'],['C','Moderately well drained','No','0.37'],['D','Not reported','No','Not reported']])
by=para(p,bx,by,bw,'Mapped component properties; site-specific infiltration and groundwater investigation governs facility design.',10)
by=heading(p,bx,by,bw,'LEGEND')
by=para(p,bx,by,bw,'PUE - Public Utility Easement; IPF - Iron Pipe Found; BRL - Building Restriction Line; W / WHC - Water House Connection; S / SHC - Sanitary House Connection; ESD - Environmental Site Design; LOD - Limit of Disturbance. Plat notation: For Public Water and Sewer Only.',10)
by=heading(p,bx,by,bw,'GRADING CERTIFICATE - PROFESSIONAL EXECUTION REQUIRED')
by=para(p,bx,by,bw,note_source('PG_GRADING_CERTIFICATE'),9)
assert by<1698,by
p.draw_rect(pdf.Rect(18,18,2574,1710),color=INK,width=.8)
main=ROOT/'Rollins-Avenue-Updated-Site-Plan.pdf';doc.set_metadata({'title':'Rollins Avenue - selected baseline revision','subject':'Preliminary civil drawing; unresolved design items in supporting dossier'})
doc.save(main,garbage=4,deflate=True)
p.get_pixmap(matrix=pdf.Matrix(.8,.8)).save(ROOT/'site-plan-preview.png')

# A separate supporting dossier keeps the selected one-sheet composition intact.
support=pdf.open();titles=[]
def new(title):
 q=support.new_page(width=612,height=792);titles.append(title)
 text(q,36,39,'ROLLINS AVENUE | 1005 & 1009',15,True)
 text(q,36,61,title,12,True)
 text(q,36,770,f'PRELIMINARY COORDINATION | 09 SEPTEMBER 2026 | {len(support)}',9)
 return q,90
q,y=new('Record conditions and property schedule')
y=para(q,36,y,540,'Porter Subdivision, Lots 1 and 2. Recorded plat PM 231 / 50. This dossier accompanies the revised user-selected C-001. It does not establish current agency approval.')
y=table(q,36,y,540,['PROPERTY','RECORDED AREA','DWELLING'],[['Lot 1 / 1005','9,598 SF','1,196 SF'],['Lot 2 / 1009','8,008 SF','1,196 SF'],['Net lots','17,606 SF','2,392 SF'],['Public dedication','4,219 SF',''],['Gross tract','21,825 SF','']])
for i,n in enumerate(record['notes'],1):y=para(q,36,y,540,f'{i}. {n}',11)
y=heading(q,36,y+10,540,'ADJOINERS OF RECORD')
for a in record['adjoiners']:y=para(q,36,y,540,f'{a["label"]} - {a["reference"]}',10)
q,y=new('Measurements and proposed work-limit takeoff')
y=para(q,36,y,540,'Quantities below are measured from the vector paths in the user-selected PDF at its verified 3.6 points per foot scale. The two dwelling polygons each measure approximately 1,196 SF. They are not measurements from a later replacement drawing.')
y=table(q,36,y,540,['MEASURE','LOT 1','LOT 2'],[['Front clearance',f'{measured[0]["frontFt"]:.2f} ft',f'{measured[1]["frontFt"]:.2f} ft'],['Side clearances',' / '.join(f'{v:.2f}' for v in measured[0]['sideFt']),' / '.join(f'{v:.2f}' for v in measured[1]['sideFt'])],['Footprint coverage','12.46%','14.94%'],['Polygon work area',f'{lots[0].area/SCALE**2:,.2f} SF',f'{lots[1].area/SCALE**2:,.2f} SF']])
outside=lod.difference(lot_union).area/SCALE**2
y=para(q,36,y,540,f'Total proposed LOD union: {lod.area/SCALE**2:,.2f} SF, rounded up to {math.ceil(lod.area/SCALE**2):,} SF on C-001. Offsite polygon area outside both lots: {outside:,.2f} SF. Small PDF path-rounding differences are included in geometric takeoffs, while recorded areas govern the property schedule.')
y=para(q,36,y,540,'The proposed LOD covers full-lot development and the depicted paving/public utility corridor. Utility reconstruction and work access may change its final extent. Final ESC design and offsite authorizations remain required. The work-limit outline is not a designed sediment barrier.')
y=heading(q,36,y+12,540,'BOUNDARY / BUILDING COORDINATION')
y=para(q,36,y,540,'Bearing labels were corrected to the recorded 79-29-14 and 10-30-46 calls; frontage is 134.64 ft on Lot 2. The outer frontage label is 222.27 ft. The source coordinate geometry is retained for survey reconciliation. No legal boundary has been adjusted merely to force numerical closure.')
y=para(q,36,y,540,'The selected PDF shows both nominal 46 x 26 dwellings. The available Kingsworth source is a basement/foundation page with an optional one-car garage and rear areaway. Final basement, veneer, egress/areaway, stoop and roof projections must be coordinated before a complete zoning clearance calculation or grading design is issued.')
q,y=new('Soils and environmental evidence')
soil=json.loads((REPO/'output/site-plans/porter-corrected/sources/porter-site-soils.json').read_text())
y=para(q,36,y,540,'Soil map unit AeB: Adelphia-Holmdel-Urban land complex, 0 to 5 percent slopes. Parcel-intersection query retrieved September 9, 2026. Component properties follow; these regional map properties do not replace site testing.')
y=table(q,36,y,540,['HSG','DRAINAGE','HYDRIC','K FACTOR'],[[r[3],r[4] or 'Not reported',r[2],r[5] or 'Not reported'] for r in soil['Table']])
y=para(q,36,y,540,'Source: USDA NRCS Soil Data Access. The returned major-component rows include B/D, C and D groups. Do not assign a single infiltration rate or hydrologic group to facility design without site investigation.')
y=heading(q,36,y+12,540,'HISTORICAL PLANNING RECORD')
y=para(q,36,y,540,'The Porter 4-06111 staff report identifies NRI/116/06, a woodland exemption dated June 7, 2007, and Stormwater Concept 41230-2006-00 dated May 21, 2007 with drywells. It reports no streams, wetlands, 100-year floodplain or Marlboro clay on the site. These are historical findings; the current applicable approvals and exemption letter must be obtained and checked.')
y=heading(q,36,y+12,540,'FACILITY DESIGN INPUTS STILL REQUIRED')
for s in ['Surveyed drainage areas, flow paths and receiving outfall; field grades and floor/slab elevations.','Soil profile, tested infiltration rate, seasonal groundwater and limiting-layer elevations.','Approved design storm criteria, ESD sizing, facility sections and storage; outlet, overflow, drawdown and maintenance design.','Current tree-conservation approval or exemption; final species, quantities, sizes, canopy calculations and planting locations.']:
 y=para(q,36,y,540,s)
y=para(q,36,y,540,'The selected plan\'s ESD footprints and Q/WQv summary were preliminary. This revision does not promote those screening quantities into approved hydraulic design. Supporting engineering calculations must use the final building and pavement coverage, including all applicable contributing areas.')
q,y=new('Professional certification blocks - unsigned')
y=heading(q,36,y,540,'GRADING CERTIFICATE')
y=para(q,36,y,540,note_source('PG_GRADING_CERTIFICATE'),11)
y=heading(q,36,y+25,540,'MARYLAND PROFESSIONAL CERTIFICATION')
y=para(q,36,y,540,'I HEREBY CERTIFY THAT THESE DOCUMENTS WERE PREPARED OR APPROVED BY ME, AND THAT I AM A DULY LICENSED PROFESSIONAL ENGINEER UNDER THE LAWS OF THE STATE OF MARYLAND.')
for label in ['NAME / LICENSE NUMBER / EXPIRATION','SIGNATURE / DATE','SEAL','OWNER / APPLICANT NAME / ADDRESS / PHONE','DESIGNER NAME / ADDRESS / PHONE','CHECKER / DATE']:
 y+=37;q.draw_line((36,y),(576,y),color=GREY);text(q,36,y+14,label,9);y+=18

# Worksheet is explicitly a preparation aid, not an executed county form.
issues=[
 ('R01','OPEN','Field survey, grading, floors, driveway profiles and utility inverts'),
 ('R02','PARTIAL','Both addresses added; owner and responsible professional details/signatures required'),
 ('R03','OPEN','Public utility containment and continuous approved connections'),
 ('R04','OPEN','Recorded private easement limits and WSSC junction design'),
 ('R05','OPEN','Approved concept and full stormwater design/report'),
 ('R06','PARTIAL','Proposed measured LOD added; final ESC design and approvals remain'),
 ('R07','PARTIAL','Soil component table/historical evidence added; current environmental/landscape documents remain'),
 ('R08','PARTIAL','Measured per-lot footprint clearances/ratios added; yard interpretation and projections remain'),
 ('R09','PARTIAL','Recorded areas and label corrections made; survey/control reconciliation remains'),
 ('R10','CLOSED','Full recorded conditions/adjoiners/legend supplied without ellipses'),
 ('R11','OPEN','Frontage width, cross slopes, driveway profiles and DPW&T determination'),
 ('R12','OPEN','Complete coordinated architectural, structural and trade/energy drawings'),
 ('R13','PARTIAL','Source dossier and preparation worksheet supplied; executed applications/approvals remain'),
]
q,y=new('Application completion worksheet')
y=para(q,36,y,540,'DRAFT FOR THE RESPONSIBLE DESIGN PROFESSIONAL. Status reflects the files available here; it is not a county certification or agency decision. Complete official submittal and applicable design-review checklists with the application.')
for ident,status,resolution in issues:y=para(q,36,y,540,f'{ident} - {status}: {resolution}',10)
y=heading(q,36,y+10,540,'REFERENCE AND SUBMISSION FILES')
y=para(q,36,y,540,'County Building Permit / Site-Road Design Review Checklist: DocumentCenter/View/33110. Fine Grading Design Checklist: DocumentCenter/View/4549. Fine Grading Submittal Checklist: DocumentCenter/View/4569. Current county index checked September 9, 2026; direct PDF downloads returned HTTP 403. Use the linked official forms listed in README.md.')
y=para(q,36,y,540,'Attach applicable current concept, fine-grading, ESC, stormwater, WSSC, street and environmental approvals; ownership/authorization and parcel identification; executed professional certifications and supporting calculations. Check application-stage versus issuance-stage prerequisites with the responsible reviewer.')
q,y=new('Utility source reference - original page 2')
utility=pdf.open(REPO/'existing site plans/ScanRollions SW Easemenmt.pdf')
q.show_pdf_page(pdf.Rect(36,100,576,670),utility,1)
para(q,36,700,540,'Source reproduction only. The original sketch controls the depicted connection concept; it does not supply a dimensioned private legal width or final surveyed vertical design.',10)
q,y=new('Baseline drainage summary - preliminary')
y=para(q,36,y,540,'The selected baseline contains the following drainage summary. It is retained here for design coordination. These are baseline screening outputs, not a completed hydraulic report or final ESD facility sizing.')
y=table(q,36,y,540,['PARAMETER','LOT 1','LOT 2'],[['Baseline catchment SF','9,599','8,009'],['Baseline impervious %','17.0','20.4'],['Baseline pre Q (cfs)','0.37','0.31'],['Baseline post Q (cfs)','0.55','0.48'],['Baseline WQv (CF)','163','156'],['Depicted ESD footprint','214 SF','241 SF']])
y=para(q,36,y,540,'The property schedule uses recorded areas 9,598 / 8,008 SF. The baseline catchment values above were computed geometry values. Recalculate the drainage model from final surveyed catchments and the complete selected building/pavement design before sizing facilities.')
y=heading(q,36,y+10,540,'CALCULATION PACKAGE TO COMPLETE')
for item in ['Existing and proposed drainage maps with tributary areas and runoff classifications.','Rainfall depths/intensities, documented times of concentration and pre/post discharge calculations.','ESD volume, recharge and applicable quantity-control analysis; tested infiltration and facility storage/outlet computations.','Finished grades, facility sections, groundwater/limiting-layer separation and drawdown.','Receiving outfall capacity and the 100-year blocked-system overflow route; coordinated building protection levels.']:
 y=para(q,36,y,540,item)
y=para(q,36,y,540,'No new stormwater performance is claimed by reproducing these values. Final approval must be coordinated with Concept 41230-2006-00 or its applicable approved revision.')
support.save(ROOT/'Rollins-Avenue-Supporting-Dossier.pdf',garbage=4,deflate=True)
for i,q in enumerate(support):q.get_pixmap(matrix=pdf.Matrix(1,1)).save(ROOT/f'dossier-preview-{i+1}.png')
# Preserve original source documents separately; their signatures attest only to those originals.
for src,name in [(REPO/'existing site plans/Rollins Ave lots.pdf','recorded-plat.pdf'),(REPO/'existing site plans/ScanRollions SW Easemenmt.pdf','wssc-connection-source.pdf'),(REPO/'existing site plans/Kingsworth 2nd & basement floor plan.pdf','kingsworth-supplied-foundation.pdf'),(REPO/'output/site-plans/porter-corrected/sources/Porter-4-06111-staff-report.pdf','historical-planning-report.pdf'),(REPO/'output/site-plans/porter-corrected/sources/porter-site-soils.json','soil-components.json')]:shutil.copyfile(src,ROOT/'sources'/name)
checks={'baselineSHA256':HASH,'sitePlanPages':len(doc),'supportingPages':len(support),'submissionReady':False,'measuredFromSelectedPDF':measured,'proposedLODsf':lod.area/SCALE**2,'offsiteLODsf':outside,'issues':[dict(zip(['id','status','resolution'],r)) for r in issues]}
(ROOT/'verification.json').write_text(json.dumps(checks,indent=2)+'\n')
with (ROOT/'completion-tracker.csv').open('w',newline='') as f:
 writer=csv.writer(f);writer.writerow(['Finding','Status','Action']);writer.writerows(issues)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==HASH
print(json.dumps(checks,indent=2))
