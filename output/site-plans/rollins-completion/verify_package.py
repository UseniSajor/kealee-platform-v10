from pathlib import Path
import hashlib,json
import pymupdf as pdf
ROOT=Path(__file__).resolve().parent
source=ROOT.parent/'rollins-submission-review/porter-BEST-BACKUP.REVIEW.pdf'
base=pdf.open(source);main=pdf.open(ROOT/'Rollins-Avenue-Updated-Site-Plan.pdf');support=pdf.open(ROOT/'Rollins-Avenue-Supporting-Dossier.pdf')
v=json.loads((ROOT/'verification.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest()==v['baselineSHA256']
assert len(main)==1 and len(support)==7
assert tuple(main[0].rect)==tuple(base[0].rect)
s=main[0].get_text();alltext=s+'\n'+''.join(p.get_text() for p in support)
for required in ['9,598 SF','8,008 SF','17,606 SF','21,825 SF','134.64','19,171 SF','STANDARD STABILIZATION NOTE','GRADING CERTIFICATE','VICINITY MAP','Iron Pipe Found','upon the issuance of street construction permits.']:
 assert required in alltext,required
for obsolete in ['16,789','AT LEAST','13.6%','20\'\n20\'','PROPOSED GRADE SHOWN SOLID','ROUGH EARTHWORK GRADES AND UTILITY ELEVATIONS SHOWN TO','79°29\'04','10°30\'43','134.65','8,009 SQ FT']:
 assert obsolete not in s,obsolete
# The two original dwelling quadrilaterals must remain exactly unchanged.
original=base[0].get_drawings();updated=main[0].get_drawings()
for i in [6989,7035]:
 d=original[i]
 assert any(q['items']==d['items'] and q['color']==d['color'] for q in updated),f'Dwelling vector {i} changed'
for title,d in [('site',main),('dossier',support)]:
 for i,p in enumerate(d):
  for b in p.get_text('dict')['blocks']:
   for line in b.get('lines',[]):
    for span in line['spans']:
     assert p.rect.contains(pdf.Rect(span['bbox'])),(title,i,span['text'])
assert not v['submissionReady']
result={'sourceUnchanged':True,'sitePlanPages':1,'supportingPages':7,'bothDwellingVectorsPreserved':True,'requiredNotesPresent':True,'obsoleteTextRemoved':True,'textWithinPages':True,'submissionReady':False}
(ROOT/'validation.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
