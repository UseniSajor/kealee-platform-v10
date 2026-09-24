from pathlib import Path
import hashlib,json
import pymupdf as pdf
ROOT=Path(__file__).resolve().parent
SRC=ROOT.parent/'rollins-legend-revision/Porter-Rollins-Avenue-Site-Plan-Rev4.pdf'
hash_before=hashlib.sha256(SRC.read_bytes()).hexdigest()
doc=pdf.open(SRC);p=doc[0];old=pdf.open(SRC)
INK=(.1,.12,.14)
def text(x,y,s,size=10,bold=False):p.insert_text((x,y),s,fontsize=size,fontname='hebo' if bold else 'helv',color=INK)
# Use the existing title-column panel for a full revision record.
p.add_redact_annot(pdf.Rect(2057,1203,2563,1419),fill=(1,1,1))
for r in p.search_for('REVISION 4 - 10 SEPTEMBER 2026'):p.add_redact_annot(r,fill=(1,1,1))
p.apply_redactions(images=0,graphics=0)
text(2070,137,'REVISION 5 - 10 SEPTEMBER 2026',11,True)
p.draw_rect(pdf.Rect(2056,1202.4,2564,1420),color=INK,width=1)
p.draw_rect(pdf.Rect(2057,1203,2563,1230),color=None,fill=(.88,.92,.94))
text(2070,1222,'REVISION RECORD',13,True)
xs=[2056,2095,2175,2503,2564]
p.draw_rect(pdf.Rect(2057,1230,2563,1252),color=None,fill=(.94,.96,.97))
for x,s in zip(xs,['REV.','DATE','DESCRIPTION','BY']):text(x+7,1245,s,9,True)
rows=[['2','09/09/26','Areaways, leadwalks and record coordination',''],['3','09/10/26','Updated surface takeoff and drainage screening',''],['4','09/10/26','Information-block dividers and graphical legend',''],['5','09/10/26','Revision record added; professional fields relocated',''],['','','',''],['','','',''],['','','','']]
for i,row in enumerate(rows):
 y=1252+i*24
 for j,s in enumerate(row):
  assert pdf.Font('helv').text_length(s,fontsize=9)<xs[j+1]-xs[j]-14
  text(xs[j]+7,y+16,s,9)
for y in [1230,1252]+[1252+24*i for i in range(1,8)]:p.draw_line((2056,y),(2564,y),color=INK,width=.6)
for x in xs[1:-1]:p.draw_line((x,1230),(x,1420),color=INK,width=.6)
# Preserve all four professional fields in the unused lower technical panel.
p.draw_rect(pdf.Rect(1035,1612,2020,1698),color=INK,width=.8,fill=(1,1,1))
p.draw_rect(pdf.Rect(1036,1613,2019,1637),color=None,fill=(.92,.94,.95))
text(1050,1630,'RESPONSIBLE PROFESSIONAL / APPLICANT',12,True)
p.draw_line((1527.5,1637),(1527.5,1698),color=INK,width=.5)
for x,y,label in [(1050,1653,'OWNER / APPLICANT / CONTACT'),(1542,1653,'DESIGNER / ADDRESS / PHONE'),(1050,1680,'CHECKER / DATE'),(1542,1680,'PROFESSIONAL SIGNATURE / SEAL / LICENSE / EXPIRATION')]:
 p.draw_line((x,y),(x+463,y),color=(.45,.48,.5),width=.5);text(x,y+12,label,8)
out=ROOT/'Porter-Rollins-Avenue-Site-Plan-Rev5.pdf';doc.save(out,garbage=4,deflate=True)
p.get_pixmap(matrix=pdf.Matrix(.8,.8)).save(ROOT/'site-plan-preview.png')
p.get_pixmap(matrix=pdf.Matrix(1.7,1.7),clip=pdf.Rect(2045,1194,2574,1425)).save(ROOT/'revision-block-preview.png')
# Check drawing preservation and content after export.
check=pdf.open(out);q=check[0];clip=pdf.Rect(18,18,2035,1105)
assert q.get_pixmap(matrix=pdf.Matrix(.5,.5),clip=clip).samples==old[0].get_pixmap(matrix=pdf.Matrix(.5,.5),clip=clip).samples
for s in ['REVISION RECORD','DESCRIPTION','BY','SITE PLAN LEGEND - LINES AND SYMBOLS','RESPONSIBLE PROFESSIONAL / APPLICANT','REVISION 5']:
 assert s in q.get_text(),s
for b in q.get_text('dict')['blocks']:
 for line in b.get('lines',[]):
  for span in line['spans']:assert q.rect.contains(pdf.Rect(span['bbox'])),span['text']
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==hash_before
(ROOT/'validation.json').write_text(json.dumps({'revision':5,'sourceUnchanged':True,'sourceSHA256':hash_before,'mainPlanViewPixelIdentical':True,'revisionColumns':['REV.','DATE','DESCRIPTION','BY'],'populatedRows':4,'blankRows':3,'professionalFieldsRetained':True,'legendRetained':True,'textWithinPage':True},indent=2)+'\n')
print(out)
