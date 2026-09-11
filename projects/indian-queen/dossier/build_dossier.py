from pathlib import Path
import hashlib,json,csv
import pymupdf as pdf
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parents[2];BASE=REPO/'output/site-plans';SRC=REPO/'existing site plans'
PLAN=BASE/'indian-queen-lots-53-56.1789052980940.pdf'
record=json.loads((BASE/'indian-queen.plat-record.json').read_text())
files=[('A','Latest generated plan set',PLAN,[0,0,0]),('B','Recorded subdivision plat',SRC/'Indian Queen lots.pdf',[90]),('C','Highlighted easement map',SRC/'ScanIndian Queen easement Map.pdf',[270]),('D','Tax accounts and duplicate highlighted plat',SRC/'Indian Queen lots including tax acc.pdf',[0,90,0,0,0]),('E','Topographic survey - black and white',SRC/'Indian Queen lots topo.pdf',[0]),('F','Topographic survey - color scan',SRC/'Indian Queen lots  topo 2.pdf',[0]),('G','Topographic survey - marked overlay scan',SRC/'Indian Queen lots floodplain topo.pdf',[0]),('H','County floodplain letter and historical grading sheet',SRC/'Indian Queen FPS.pdf',[0,90]),('I','Historical subdivision site plans',SRC/'Indian Queen site plan.pdf',[270,270,270])]
registry=[];cursor=7
for ident,title,path,rot in files:
 d=pdf.open(path);assert len(d)==len(rot)
 registry.append({'id':ident,'title':title,'path':str(path.relative_to(REPO)),'pages':len(d),'firstPage':cursor,'lastPage':cursor+len(d)-1,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'rotations':rot});cursor+=len(d)
doc=pdf.open();toc=[];INK=(.13,.19,.23);ACCENT=(.08,.36,.42)
def text(p,x,y,s,size=10,bold=False):
 p.insert_text((x,y),s,fontname='hebo' if bold else 'helv',fontsize=size,color=INK)
def new(title):
 p=doc.new_page(width=612,height=792);toc.append([1,title,len(doc)])
 p.draw_rect(pdf.Rect(0,0,612,12),color=None,fill=ACCENT)
 text(p,36,44,'INDIAN QUEEN EAST | LOTS 53-56',16,True);text(p,36,68,title,13,True)
 text(p,36,767,f'SOURCE DOSSIER | 10 SEPTEMBER 2026 | {len(doc)}',9)
 return p,100
def para(p,y,s,size=10.5):
 words=s.split();line='';lines=[];font=pdf.Font('helv')
 for word in words:
  trial=(line+' '+word).strip()
  if font.text_length(trial,fontsize=size)>540:lines.append(line);line=word
  else:line=trial
 if line:lines.append(line)
 assert y+len(lines)*size*1.4<738,(s[:60],y)
 for line in lines:text(p,36,y,line,size);y+=size*1.4
 return y+10
def head(p,y,s):
 p.draw_rect(pdf.Rect(36,y-13,576,y+7),color=None,fill=(.91,.95,.95));text(p,42,y,s,11,True);return y+28
def table(p,y,headers,rows,widths=None):
 widths=widths or [540/len(headers)]*len(headers)
 for i,row in enumerate([headers]+rows):
  x=36;p.draw_rect(pdf.Rect(36,y,576,y+26),color=(.77,.82,.83),width=.5,fill=(.94,.96,.96) if i==0 else None)
  for val,w in zip(row,widths):
   assert pdf.Font('hebo' if i==0 else 'helv').text_length(str(val),fontsize=9)<w-8,(val,w)
   text(p,x+4,y+17,str(val),9,i==0);x+=w
  y+=26
 return y+16
p,y=new('Supporting records and design coordination')
y=para(p,y,'9588, 9584, 9580 and 9576 Fort Foote Road, Fort Washington, Maryland. Indian Queen East, Block F, Lots 53, 54, 55 and 56. Prince George\'s County; Tax Map 113, Grid E4.')
y=para(p,y,'This dossier assembles the supplied property, survey, easement, tax, floodplain and historical design records alongside the newest timestamped three-sheet plan found for this review. It preserves the source documents and identifies discrepancies requiring coordination. It is not an approval or an executed permit set.')
y=head(p,y,'CONTENTS')
y=table(p,y,['DOSSIER SECTION','PAGES'],[['Property and area reconciliation','2'],['Survey, floodplain and easement evidence','3'],['Current plan quantities and elevations','4'],['Design coordination register','5'],['Source index and version control','6']]+[[r['id']+' - '+r['title'],str(r['firstPage']) if r['pages']==1 else f'{r["firstPage"]}-{r["lastPage"]}'] for r in registry],[430,110])
y=para(p,y,'Use PDF bookmarks to jump to each source. Original large-format sheets are retained at their source page size and rotated for reading. Print those sheets at actual size only when using their original scale; reduced prints and scans may not preserve survey scale.',10)
p,y=new('Property records and area reconciliation')
y=para(p,y,'Source D contains the 2025-2026 county tax bills for all four lots. The account, address and tax-area figures below were checked directly against those bill images. Tax areas and plan polygon areas are separately identified; no legal boundary is changed by this compilation.')
lotnums=['53','54','55','56'];draw=[12389,23371,25733,13690]
y=table(p,y,['LOT','FORT FOOTE RD','ACCOUNT','TAX SF','PLAN SF'],[[n,record['lots'][n]['address'].split()[0],record['lots'][n]['account'],f'{record["lots"][n]["recordedAreaSqFt"]:,}',f'{draw[i]:,}'] for i,n in enumerate(lotnums)],[45,140,115,120,120])
y=para(p,y,'Tax-bill total: 74,751 SF. The four rounded plan lot figures sum to 75,183 SF; the printed net total is 75,184 SF and gross total is 75,178 SF. Reconcile lot geometry, rounding and tract definitions before carrying a final area schedule.')
y=head(p,y,'OWNERS AND DEED REFERENCES AS SHOWN ON TAX BILLS')
y=para(p,y,'Lots 53 and 56: I & I Construction Co Inc; Liber 09202, Folio 056. Lots 54 and 55: Interdonato Andrew G Etal; Liber 42743, Folio 456. These identify the supplied 2025-2026 records and are not a new title search.')
y=head(p,y,'BOUNDARY BASIS')
y=para(p,y,'Recorded subdivision reference: Plat Book WWW 65, page 60. The supplied plat is the boundary survey of record. The earlier transcription closes Lot 53 at approximately 12,000.8 SF from 150.01 by 80.00 ft calls, consistent with its 12,001 SF tax area. Calls for Lots 54-56 are marked incomplete in that transcription; a generic drawing note claiming every lot was closed does not resolve this.')
y=para(p,y,'Lot 55: the supplied tax bill clearly states 25,496 SF. An earlier plat transcription reports an ambiguous reading of 25,096 versus 25,496 SF. Retain the source image and resolve the plat lettering before declaring a definitive recorded-area value. The generated plan instead shows 25,733 SF.')
y=para(p,y,'The current drawings label RSF-95 and use a 30-ft front design line, 8-ft general side line and 20-ft rear line. This dossier reports what is drawn; it does not independently certify zoning, building projections, easement clearance or legal frontage curves.')
p,y=new('Survey, floodplain and easement evidence')
y=head(p,y,'THE SUPPLIED TOPOGRAPHIC SURVEY IS INCLUDED')
y=para(p,y,'Sources E-G show the supplied topographic survey in three scan variants, with contours, spot elevations, a concrete flume and drainage features. Prior notes stating that no survey is supplied are inconsistent with these files. The remaining task is to register and use that survey in the design, with its control and vertical basis established.')
y=table(p,y,['BENCHMARK','TRANSCRIBED ELEVATION'],[['H31A','61.09 ft'],['H32A','74.37 ft'],['H32B','66.41 ft']],[270,270])
y=para(p,y,'Benchmark figures are transcribed in the existing project record and shown on the supplied survey scans. They are not newly observed recoveries. The generated plan declares NAVD88; the historical site plans expressly use WSSC datum. No datum conversion is supplied by this dossier.')
y=head(p,y,'COUNTY LETTER: JULY 16, 1979 / FPS 770017')
y=para(p,y,'Source H, page 1, is a county DPW&T letter concerning Broad Creek tributary and permits 3201-3203-79 RGU. It reports an approximately 57-ft 100-year floodplain elevation in WSSC datum along the stream, and an overflow swale along the rear storm-drain easement of Lots 50-53, Block F.')
y=para(p,y,'The letter raises a historical question about floodplain easements on Lots 53 and 54 before permit release. This is a 1979 record, not a finding that an easement is currently unrecorded. Reconcile it with the supplied recorded easements and later actions. The 57-ft figure must not be treated as a NAVD88 design elevation without a documented relationship.')
y=head(p,y,'SOURCE LIMITS AND CONFLICTS')
y=para(p,y,'Earlier desktop summaries describing minimal FEMA flood hazard do not dispose of the local floodplain letter or drainage evidence. No current floodplain determination is made here. Colored lines on the marked topo scan lack a definitive legend; do not label them as a certified regulatory boundary solely from their color.')
y=para(p,y,'Source C supplies the highlighted easement map. Source B and the historical plans also carry drainage and utility annotations. Associate each designed segment with the applicable recorded alignment, width and beneficiary; highlighted lines and old permit comments alone do not establish new easement terms.')
p,y=new('Current plan snapshot - transcribed, not recertified')
y=para(p,y,'Source A is the three-sheet generated set: C-001 site development, L-100 landscape and C-400 grading/drainage. All four houses are shown with a 1,196 SF nominal footprint (46 x 26 ft). The following values are copied from its schedules, not recomputed or validated as final engineering.')
y=table(p,y,['LOT','GARAGE FT','BASEMENT FT','FF FT','SUBFLOOR FT'],[['53','58.89','50.22','59.22','58.22'],['54','55.64','46.97','55.97','54.97'],['55','55.67','47.00','56.00','55.00'],['56','60.68','52.01','61.01','60.01']],[45,115,135,110,135])
y=table(p,y,['LOT','IMPERV.','PRE Q','POST Q','WQv CF'],[['53','15.1%','0.49','0.69','192'],['54','9.4%','0.92','1.16','263'],['55','8.2%','1.01','1.24','266'],['56','14.2%','0.54','0.75','203'],['Total','10.8%','2.96','3.84','924']],[60,120,120,120,120])
y=para(p,y,'Q values are cfs. These are the printed drainage-table values, including its 924 CF total; this dossier does not establish their regulatory sufficiency, minimum treatment volume, ESD credit or facility capacity.')
y=head(p,y,'SWale AND DISTURBANCE COORDINATION'.upper())
y=para(p,y,'The swale schedule lists ST-1 to ST-2: 110 ft, 3.01%, inverts 50.20/46.90 ft; ST-4 to ST-3: 157 ft, 4.98%, inverts 60.30/52.50 ft; ST-3 to ST-2: 177 ft, 3.17%, inverts 52.50/46.90 ft. The OUT invert remains blank. Establish the complete receiving outfall, tailwater and overflow route.')
y=para(p,y,'The printed disturbance is 41,662 SF (AT LEAST), superseding the older manifest\'s approximately 7,800 SF figure. Neither is adopted here as a verified final union takeoff. The latest sheet shows 3.57 cfs Q10 at the system low point versus 3.84 cfs total post-development in its drainage table; reconcile routing and calculation assumptions.')
y=para(p,y,'A conveyance swale and a stated water-quality volume do not by themselves document treatment storage or credit. Retain the engineering calculation package and approved concept as distinct evidence from the drawing schedules.')
p,y=new('Design coordination register')
issues=[('IQ-01','Boundary and area schedule','Reconcile the plat calls, Lot 55 area lettering, tax-area schedule, plotted geometry and gross/net totals. Keep the recorded plat as the controlling boundary source.'),('IQ-02','Survey integration and vertical datum','Use the supplied survey scans. Resolve control, WSSC versus NAVD88 relationship, building elevations, service inverts and proposed grades.'),('IQ-03','Floodplain and easement reconciliation','Resolve the 1979 FPS letter against applicable later records and the supplied easements. Establish the design flood elevation and mapped limit on the same datum as the design.'),('IQ-04','Stormwater and outfall','Complete treatment sizing/credit, final tributaries, minimum-volume checks, the OUT invert, downstream rights and hydraulics, overflow routing and coordinated concept documentation.'),('IQ-05','Landscape completion','L-100 reports 9 of 14 shade trees and 0 of 10 ornamental/evergreen trees, with 6 street trees separately listed. Species and ten-year canopy are not established in its schedule. Complete and reconcile those items.'),('IQ-06','Disturbance and construction details','Replace the at-least disturbance figure with a complete union takeoff. Coordinate ESC, fill extents/compaction, driveway grades, utility profiles and the construction sequence.'),('IQ-07','Document status and execution','Resolve NRI/TCP or exemption applicability using lot-specific evidence. Neighboring school records are not approvals for these lots. Complete building/trade documents, application materials and professional execution as applicable.')]
for ident,title,action in issues:
 y=head(p,y,ident+' | '+title.upper());y=para(p,y,action,10)
p,y=new('Source index and version control')
y=para(p,y,'Included drawings and records are reproduced for project review. Their original seals, signatures, approval notes and dates apply only to those source documents. This compilation does not apply those attestations to the new design.')
for r in registry:
 y=para(p,y,f'{r["id"]}: pages {r["firstPage"]}-{r["lastPage"]} | {Path(r["path"]).name}',9.5)
y=head(p,y,'PLAN VERSION CHOSEN FOR THIS DOSSIER')
y=para(p,y,'The standard filename indian-queen-lots-53-56.pdf contains only one sheet. The selected timestamped sibling ends in 1789052980940 and contains three. The existing manifest points to an older sibling ending in 1789039076347; it is used only as background, not as proof that every value matches the selected set.',10)
y=para(p,y,'Several older summaries are stale: they say no field topo is supplied, show an approximately 7,800 SF disturbance, or treat a neighboring NRI as applicable. The survey scans are included here, the latest drawing states 41,662 SF at least, and neighboring-property approvals are not adopted for these lots.',10)
y=para(p,y,'The accompanying source-manifest.json records each input path, SHA256 checksum, page range and display rotation. Source files and the selected design PDF remain unchanged. The compilation reflects local records reviewed September 10, 2026; it is not a fresh title search, current agency certification or full design audit.',10)
assert len(doc)==6
for r in registry:
 d=pdf.open(REPO/r['path'])
 for i,rot in enumerate(r['rotations']):d[i].set_rotation(rot)
 toc.append([1,r['id']+' | '+r['title'],len(doc)+1]);doc.insert_pdf(d)
 for i in range(len(d)):toc.append([2,f'{Path(r["path"]).name} - source page {i+1}',r['firstPage']+i])
doc.set_toc(toc);doc.set_metadata({'title':'Indian Queen East Lots 53-56 - Supporting Dossier','subject':'Source records and preliminary design coordination; September 10, 2026','author':'Kealee project records'})
out=ROOT/'Indian-Queen-Lots-53-56-Supporting-Dossier.pdf';doc.save(out,garbage=4,deflate=True)
(ROOT/'source-manifest.json').write_text(json.dumps({'dossierPages':len(doc),'summaryPages':6,'sourceFiles':registry,'selectedPlan':str(PLAN.relative_to(REPO)),'permitReady':False},indent=2)+'\n')
with (ROOT/'coordination-register.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['ID','Topic','Action']);w.writerows(issues)
# Render every page and check source preservation and summary text bounds.
for i,p in enumerate(doc):
 scale=min(1100/p.rect.width,1400/p.rect.height)
 p.get_pixmap(matrix=pdf.Matrix(scale,scale)).save(ROOT/'previews'/f'page-{i+1:02d}.png')
 if i<6:
  for b in p.get_text('dict')['blocks']:
   for line in b.get('lines',[]):
    for span in line['spans']:assert p.rect.contains(pdf.Rect(span['bbox'])),span['text']
for r in registry:assert hashlib.sha256((REPO/r['path']).read_bytes()).hexdigest()==r['sha256']
assert len(doc)==24
(ROOT/'validation.json').write_text(json.dumps({'pages':len(doc),'sourcesUnchanged':True,'allPagesRendered':True,'summaryTextWithinPages':True,'bookmarkEntries':len(toc),'permitReady':False},indent=2)+'\n')
print(out);print('Pages:',len(doc))
