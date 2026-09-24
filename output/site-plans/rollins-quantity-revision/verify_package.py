from pathlib import Path
import hashlib,json
import pymupdf as pdf
from shapely.geometry import Polygon
ROOT=Path(__file__).resolve().parent
v=json.loads((ROOT/'verification.json').read_text())
source=ROOT.parent/'rollins-submission-review/porter-BEST-BACKUP.REVIEW.pdf'
assert hashlib.sha256(source.read_bytes()).hexdigest()==v['baselineSHA256']
site=pdf.open(ROOT/'Rollins-Avenue-Record-Coordinated-Site-Plan.pdf');support=pdf.open(ROOT/'Rollins-Avenue-Supporting-Dossier.pdf')
assert len(site)==1 and len(support)==10
assert site[0].rect.width==2592 and site[0].rect.height==1728
polys=[]
for d in site[0].get_drawings():
 pts=[]
 for item in d['items']:
  if item[0]=='qu':
   q=item[1];pts=[tuple(q.ul),tuple(q.ur),tuple(q.lr),tuple(q.ll)];break
  if item[0]=='l':
   if not pts:pts.append(tuple(item[1]))
   pts.append(tuple(item[2]))
 if len(pts)>=3:
  g=Polygon(pts)
  if g.is_valid and g.area>0:polys.append(g)
for key in ['houses','areaways','walks']:
 for coords in v['geometry'][key]:
  g=Polygon(coords)
  assert any(g.hausdorff_distance(q)<.02 for q in polys),('Missing rendered geometry',key)
assert all(x['minimumBoundaryGapFt']>=8 for x in v['areawayChecks'])
assert v['measuredFromSelectedPDFWithLot2Shift'][1]['frontFt']>=30
old_private=Polygon([(747.45,384.63),(993.38,576.98),(1015.56,548.62),(794.67,375.87)])
assert not any(q.hausdorff_distance(old_private)<.02 for q in polys),'Old private rectangle remains'
for row in v['surfaceTakeoff']:
 assert abs(sum(row['surfacesSF'].values())-row['imperviousSF'])<.01
 assert abs(row['imperviousPct']-100*row['imperviousSF']/row['recordAreaSF'])<1e-8
 expected_volume=(.05*row['recordAreaSF']+.9*row['imperviousSF'])/12
 assert abs(expected_volume-row['screeningWQvCF'])<1e-8
 assert row['surfacesSF']['Areaway']>51.99 and row['surfacesSF']['Added leadwalk']>0
s=site[0].get_text();assert 'Lot-wide screening only; see dossier page 7' in s
alltext=s+''.join(p.get_text() for p in support)
for expected in ['AW-1','AW-2','30.30 ft','213.89 ft','218.28 ft','214.61 ft','0.70 ft','PRIVATE UTILITY EASEMENT','19,171 SF','166.69','158.13','17.60%','20.77%']:
 assert expected in alltext,expected
for d in [site,support]:
 for page in d:
  for block in page.get_text('dict')['blocks']:
   for line in block.get('lines',[]):
    for span in line['spans']:assert page.rect.contains(pdf.Rect(span['bbox'])),span['text']
result={'sourceUnchanged':True,'sitePages':1,'supportingPages':10,'bothHousesAndAreawaysMatchRenderedGeometry':True,'areawaySideCriterionPassed':True,'lot2FrontCriterionPassed':True,'oldPrivateRectangleRemoved':True,'textWithinPages':True,'submissionReady':False}
(ROOT/'validation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
