from pathlib import Path
import hashlib,json
import pymupdf as pdf
ROOT=Path(__file__).resolve().parent;SRC=ROOT.parent/'rollins-quantity-revision/Rollins-Avenue-Record-Coordinated-Site-Plan.pdf'
oldhash=hashlib.sha256(SRC.read_bytes()).hexdigest();doc=pdf.open(SRC);p=doc[0];original=pdf.open(SRC)
INK=(.1,.12,.14);PURPLE=(.416,.106,.604);GREEN=(.18,.49,.196);BLUE=(.082,.396,.753);BROWN=(.478,.361,.18)
def text(x,y,s,size=10.5,bold=False):p.insert_text((x,y),s,fontsize=size,fontname='hebo' if bold else 'helv',color=INK)
# Replace only two labels. All original plan geometry is retained.
for b in p.get_text('dict')['blocks']:
 for line in b.get('lines',[]):
  for span in line['spans']:
   s=span['text']
   if s=='REVISION 3 - 10 SEPTEMBER 2026' or s=='LEGEND':
    p.add_redact_annot(pdf.Rect(span['bbox']),fill=False)
p.apply_redactions(images=0,graphics=0)
text(2070,137,'REVISION 4 - 10 SEPTEMBER 2026',11,True)
# Same baseline as former abbreviation heading, in its existing shaded band.
text(1056,1489.2,'ABBREVIATIONS',12,True)
# Continuous border separates plan graphics from project data and notes.
p.draw_line((2045,18),(2045,1710),color=INK,width=1.8)
p.draw_rect(pdf.Rect(2056,28,2564,1700),color=INK,width=1.1)
headers=['SITE DATA - RECORDED AREAS','MEASURED FOOTPRINT CLEARANCES','NOTES OF RECORD - COMPLETE','GENERAL AND CONSTRUCTION NOTES','STANDARD STABILIZATION NOTE','DISTURBANCE AND SUPPORTING INFORMATION','RESPONSIBLE PROFESSIONAL / APPLICANT']
for heading in headers:
 r=p.search_for(heading)[0];yy=r.y0-2.16
 p.draw_line((2056,yy),(2564,yy),color=INK,width=1)
# Finish the professional-information block above the graphical legend.
p.draw_line((2056,1420),(2564,1420),color=INK,width=1)
# Outline the lower technical blocks, with clear internal section dividers.
p.draw_rect(pdf.Rect(1035,1110,2020,1298),color=INK,width=1)
p.draw_rect(pdf.Rect(1035,1300,2020,1698),color=INK,width=1)
for heading in ['ABBREVIATIONS','GRADING CERTIFICATE - PROFESSIONAL EXECUTION REQUIRED']:
 r=p.search_for(heading)[0];p.draw_line((1035,r.y0-2.16),(2020,r.y0-2.16),color=INK,width=.8)
# Add column rules to the two sidebar schedules and technical schedules.
for page_rect,cols in [(pdf.Rect(2070,214,2552,339),3),(pdf.Rect(2070,414.04,2552,514.04),3),(pdf.Rect(1050,1167,1980,1267),3),(pdf.Rect(1050,1357,1980,1457),4)]:
 # Derive exact extents from existing row boxes, avoiding text or assumptions.
 rows=[d['rect'] for d in original[0].get_drawings() if abs(d['rect'].x0-page_rect.x0)<.1 and abs(d['rect'].width-page_rect.width)<.1 and abs(d['rect'].height-25)<.1 and page_rect.y0-20<d['rect'].y0<page_rect.y1]
 if rows:
  y0=min(r.y0 for r in rows);y1=max(r.y1 for r in rows)
  for j in range(1,cols):
   x=page_rect.x0+j*page_rect.width/cols;p.draw_line((x,y0),(x,y1),color=(.55,.58,.6),width=.45)
# Dedicated graphical legend: samples match the current sheet's colors/styles.
p.draw_rect(pdf.Rect(2057,1421,2563,1699),color=None,fill=(1,1,1))
p.draw_rect(pdf.Rect(2057,1421,2563,1453),color=None,fill=(.88,.92,.94))
text(2070,1443,'SITE PLAN LEGEND - LINES AND SYMBOLS',13,True)
p.draw_line((2056,1453),(2564,1453),color=INK,width=.8)
entries=[
 ('Property / lot line','line',(0,0,0),None),
 ('Adjoining parcel','line',(.7,.7,.7),None),
 ('Building restriction (BRL)','line',(.267,.267,.267),'[7 4]'),
 ('Existing contour - minor','line',BROWN,'[6 3]'),
 ('Existing contour - index','line',BROWN,'[10 4]'),
 ('Water service (W)','line',BLUE,'[12 4]'),
 ('Sanitary service (S)','line',GREEN,'[14 3]'),
 ('Public utility easement','public',PURPLE,None),
 ('Private utility easement','line',PURPLE,'[12 3 2 3]'),
 ('Disturbance limit (LOD)','line',(.7,.14,.14),'[10 4 2 4]'),
 ('Proposed dwelling','house',(0,0,0),None),
 ('Paving / walks / stoops','paving',(.45,.45,.45),None),
 ('Proposed tree','tree',GREEN,None),
 ('ESD facility footprint','esd',GREEN,None),
]
for i,(label,kind,col,dash) in enumerate(entries):
 column=i//7;row=i%7;x=2070+column*247;y=1474+row*27
 if kind=='line':p.draw_line((x,y),(x+42,y),color=col,width=1.4 if i==0 else 1,dashes=dash)
 elif kind=='tree':p.draw_circle((x+21,y),8,color=col,width=.8)
 else:
  rect=pdf.Rect(x+5,y-7,x+38,y+7);fill={'public':(.9,.86,.95),'house':(1,1,1),'paving':(.73,.73,.73),'esd':(.94,.98,.94)}[kind]
  p.draw_rect(rect,color=col,fill=fill,width=.8)
  if kind in ['house','esd','public']:
   for z in range(3):p.draw_line((x+8+z*9,y+5),(x+17+z*9,y-5),color=col,width=.35)
 text(x+51,y+3,label,9.5)
text(2070,1677,'AW = basement areaway. ESD locations are preliminary.',9.5)
text(2070,1692,'See ABBREVIATIONS for additional plan terminology.',9.5)
# Keep outer legend and information border prominent after the white fill.
p.draw_rect(pdf.Rect(2056,1420,2564,1700),color=INK,width=1)
path=ROOT/'Porter-Rollins-Avenue-Site-Plan-Rev4.pdf';doc.save(path,garbage=4,deflate=True)
p.get_pixmap(matrix=pdf.Matrix(.8,.8)).save(ROOT/'site-plan-preview.png')
p.get_pixmap(matrix=pdf.Matrix(1.6,1.6),clip=pdf.Rect(2045,1410,2574,1710)).save(ROOT/'legend-preview.png')
# Meaningful drafting checks: map unchanged, new labels and rules present.
clip=pdf.Rect(18,18,2035,1105)
a=original[0].get_pixmap(matrix=pdf.Matrix(.5,.5),clip=clip);b=p.get_pixmap(matrix=pdf.Matrix(.5,.5),clip=clip)
assert a.samples==b.samples,'Main plan view changed'
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==oldhash
for label,_,_,_ in entries:assert label in p.get_text(),label
assert 'REVISION 4' in p.get_text() and 'ABBREVIATIONS' in p.get_text()
assert len(doc)==1 and p.rect==pdf.Rect(0,0,2592,1728)
for block in p.get_text('dict')['blocks']:
 for line in block.get('lines',[]):
  for span in line['spans']:assert p.rect.contains(pdf.Rect(span['bbox'])),span['text']
(ROOT/'validation.json').write_text(json.dumps({'revision':4,'sourceSHA256':oldhash,'sourceUnchanged':True,'mainPlanViewPixelIdentical':True,'legendEntries':len(entries),'pageSizeInches':[36,24],'textWithinPage':True,'permitReady':False},indent=2)+'\n')
print(path)
