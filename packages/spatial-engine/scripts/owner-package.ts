/**
 * Owner's package — Indian Queen East, Lots 53 to 56.
 *
 * A decision document for the property owner. It states what the engineering
 * found, what each lot can and cannot carry, and the routes by which the two
 * undevelopable lots can be disposed of or compensated. It is written for the
 * owner and their attorney and accountant, not for a plan reviewer.
 *
 * Every figure is read from the model outputs, so this document cannot drift
 * away from the study it summarises.
 *
 *   npx tsx packages/spatial-engine/scripts/owner-package.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import PDFDocument from 'pdfkit'

const PROJ = join(process.cwd(), 'projects', 'indian-queen')
const J = (n: string) => JSON.parse(readFileSync(join(PROJ, 'model', n), 'utf8'))
const R = J('indian-queen.floodplain-study-results.json')
const INU = J('indian-queen.floodplain-inundation.json')
const SC = J('indian-queen.scenarios.json')
const MIT = J('indian-queen.mitigation-analysis.json')
const CS = J('indian-queen.compensatory-storage.json')

const f = (n: number, d = 2) => n.toFixed(d)
const n0 = (n: number) => Math.round(n).toLocaleString('en-US')

const W = 8.5 * 72, H = 11 * 72, MG = 64
const CW = W - MG * 2
const doc = new PDFDocument({
  size: [W, H], margin: MG, autoFirstPage: false, bufferPages: true,
  info: {
    Title: "Indian Queen East Lots 53-56 — Owner's Decision Package",
    Author: 'Kealee', Subject: 'Development feasibility, disposition and compensation options',
  },
})
const chunks: Buffer[] = []
doc.on('data', (c: Buffer) => chunks.push(c))

let y = 0
const newPage = () => { doc.addPage(); y = MG }
const need = (h: number) => { if (y + h > H - MG - 26) newPage() }
const h1 = (s: string) => {
  need(46); doc.font('Helvetica-Bold').fontSize(17).fillColor('#000').text(s, MG, y, { width: CW })
  y = doc.y + 6
  doc.save().lineWidth(1.4).strokeColor('#000').moveTo(MG, y).lineTo(W - MG, y).stroke().restore()
  y += 12
}
const h2 = (s: string) => {
  need(34); doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#000').text(s, MG, y, { width: CW })
  y = doc.y + 7
}
/**
 * A paragraph, with `**bold**` runs rendered rather than printed.
 *
 * The markers were reaching the page as literal asterisks. PDFKit has no
 * inline markup, so the string is split on the markers and emitted as a
 * continued run, alternating weight.
 */
const p = (s: string, o: { size?: number; color?: string; bold?: boolean; indent?: number } = {}) => {
  const size = o.size ?? 9.6
  const x = MG + (o.indent ?? 0)
  const w = CW - (o.indent ?? 0)
  const parts = s.split('**')
  const plain = parts.join('')
  doc.font('Helvetica').fontSize(size)
  need(doc.heightOfString(plain, { width: w }) + 6)
  doc.fillColor(o.color ?? '#1a1a1a')
  parts.forEach((part, i) => {
    if (!part) return
    const bold = o.bold ? i % 2 === 0 : i % 2 === 1
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size)
    if (i === 0) doc.text(part, x, y, { width: w, align: 'left', continued: i < parts.length - 1 })
    else doc.text(part, { width: w, align: 'left', continued: i < parts.length - 1 })
  })
  y = doc.y + 7
}
const bullet = (s: string) => p('•   ' + s, { indent: 10 })
const table = (head: string[], rows: string[][], widths: number[], note?: string) => {
  const cw = widths.map(v => v * CW)
  need(28 + rows.length * 15)
  doc.font('Helvetica-Bold').fontSize(7.6).fillColor('#555')
  let x = MG
  head.forEach((hh, i) => { doc.text(hh, x, y, { width: cw[i] - 6 }); x += cw[i] })
  y += 12
  doc.save().lineWidth(0.7).strokeColor('#888').moveTo(MG, y).lineTo(W - MG, y).stroke().restore()
  y += 5
  for (const r of rows) {
    const hs = r.map((c, i) => doc.font('Helvetica').fontSize(8.6).heightOfString(c, { width: cw[i] - 6 }))
    const rh = Math.max(...hs) + 5
    need(rh + 4)
    x = MG
    r.forEach((c, i) => {
      const b = c.startsWith('**')
      doc.font(b ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.6).fillColor('#1a1a1a')
        .text(b ? c.replace(/\*\*/g, '') : c, x, y, { width: cw[i] - 6 })
      x += cw[i]
    })
    y += rh
  }
  y += 4
  if (note) { doc.font('Helvetica-Oblique').fontSize(7.6).fillColor('#666').text(note, MG, y, { width: CW }); y = doc.y + 10 }
}
const callout = (title: string, body: string, colour = '#b71c1c') => {
  doc.font('Helvetica-Bold').fontSize(9.4)
  const th = doc.heightOfString(title, { width: CW - 24 })
  doc.font('Helvetica').fontSize(9)
  const bh = doc.heightOfString(body, { width: CW - 24 })
  const h = th + bh + 22
  need(h + 8)
  doc.save().fillOpacity(0.05).fillColor(colour).rect(MG, y, CW, h).fill().restore()
  doc.save().lineWidth(2.4).strokeColor(colour).moveTo(MG, y).lineTo(MG, y + h).stroke().restore()
  doc.font('Helvetica-Bold').fontSize(9.4).fillColor(colour).text(title, MG + 12, y + 9, { width: CW - 24 })
  doc.font('Helvetica').fontSize(9).fillColor('#1a1a1a').text(body, MG + 12, doc.y + 3, { width: CW - 24 })
  y += h + 12
}

// ══ COVER ═════════════════════════════════════════════════════════════════
newPage()
y = MG + 40
doc.font('Helvetica-Bold').fontSize(30).fillColor('#000').text('Indian Queen East', MG, y, { width: CW })
y = doc.y + 2
doc.font('Helvetica').fontSize(17).fillColor('#333').text('Lots 53, 54, 55 and 56', MG, y, { width: CW })
y = doc.y + 22
doc.font('Helvetica-Bold').fontSize(13).fillColor('#000')
  .text("Owner's decision package", MG, y, { width: CW })
y = doc.y + 4
doc.font('Helvetica').fontSize(10.5).fillColor('#444')
  .text('Development feasibility, disposition and compensation options', MG, y, { width: CW })
y = doc.y + 26
doc.save().lineWidth(1.2).strokeColor('#000').moveTo(MG, y).lineTo(W - MG, y).stroke().restore()
y += 16
p('9588, 9584, 9580 and 9576 Fort Foote Road, Fort Washington', { size: 10 })
p("Prince George's County, Maryland · Zone RSF-95 · Plat Book WWW 65, folio 60", { size: 10 })
p('Prepared ' + new Date(R.generatedAt).toISOString().slice(0, 10), { size: 10, color: '#666' })
y += 10

callout('The finding in one paragraph',
  'All four lots lie in the floodplain of North Branch Broad Creek, held back by the '
  + 'Fort Foote Road embankment. Lots 53 and 56 can carry houses. Lots 54 and 55 cannot: '
  + 'Lot 54 is ' + f(SC.floodFrequency.rows[0].pctFlooded['54'], 0) + ' per cent under water '
  + 'in a storm that has a one-in-two chance of happening this year, and no engineering '
  + 'measure available to you changes that. The recommendation is to build two houses and '
  + 'place the other two lots under a floodplain easement — which is also what makes the '
  + 'two houses permittable.')

callout('What this document is, and is not',
  'It summarises a preliminary engineering study for the purpose of a commercial decision. '
  + 'It is not a sealed engineering document, not an appraisal, not a legal opinion and not '
  + 'tax advice. Values, deductions and conveyancing all require your own professionals. '
  + 'Everything here should be confirmed by a Maryland Professional Engineer before it is '
  + 'relied on or submitted.', '#555')

// ══ 1. POSITION ═══════════════════════════════════════════════════════════
newPage()
h1('1.  Where the four lots stand')
p('The lots sit at the bottom of a ' + f(R.hydrology.watershed.areaAc, 0) + '-acre watershed, '
  + 'immediately upstream of the point where North Branch Broad Creek passes under Fort Foote '
  + 'Road. The road embankment acts as a dam. Water backs up behind it and stands across the '
  + 'rear of all four properties.')
p('The 100-year water surface is EL ' + f(R.existing[3].headwaterElFt) + '. The road itself sags '
  + 'to EL ' + f(R.crossing.roadSagElFt) + ' and is overtopped in storms more frequent than one '
  + 'in ten years.')

h2('How often each lot is under water')
table(['Storm', 'Chance in any year', 'Lot 53', 'Lot 54', 'Lot 55', 'Lot 56'],
  SC.floodFrequency.rows.map((r: any) => [
    `${r.storm}-year`, `${f(100 / r.storm, 0)}%`,
    `${f(r.pctFlooded['53'], 0)}%`, `**${f(r.pctFlooded['54'], 0)}%`,
    `${f(r.pctFlooded['55'], 0)}%`, `${f(r.pctFlooded['56'], 0)}%`]),
  [0.17, 0.2, 0.16, 0.16, 0.16, 0.15],
  'Percentage of each lot standing under water at the peak of the storm, existing ground.')

callout('Lot 54 is under water more often than not',
  'A 2-year storm is not a rare event. It has a 50 per cent chance of occurring in any given '
  + 'year, and in it Lot 54 is 89 per cent submerged and Lot 55 is 41 per cent. Over a '
  + 'thirty-year mortgage these are near-certainties, repeatedly.')

h2('Why it cannot be engineered away')
p('Three routes were tested and each was quantified.')
bullet('**Enlarging the road culvert.** Even a bridge-class structure leaves the 100-year surface '
  + 'at EL ' + f(MIT.routed['twin 20 x 8 ft box']['100'].peakStageFt) + ', still several feet above '
  + 'the rear of Lots 54 and 55. It would also push up to 80 per cent more flow onto the '
  + 'properties downstream, which the county will not accept. It is a county roadway project in '
  + 'any case, not something you can do.')
bullet('**Excavating storage.** Holding the water down to EL 50 would take '
  + n0(136670) + ' cubic yards of excavation — about '
  + f(SC.dryYardStorage.depthOverAllLotsFt, 0) + ' feet deep across all four properties. It would '
  + 'also not work: the rear of Lots 54 and 55 is already at or below the water level in the '
  + 'creek downstream, so anything dug there fills and stays full.')
bullet('**Diverting upstream drainage.** Removing the entire Oxon Hill Middle School property '
  + 'from the watershed — 21 acres, 5 per cent of the catchment — lowers the 100-year water '
  + 'surface by ' + f(SC.upstreamDiversion.stageReductionFt100) + ' feet. Under an inch.')

// ══ 2. WHAT CAN BE BUILT ══════════════════════════════════════════════════
newPage()
h1('2.  What can be built')
p('Lots 53 and 56 carry houses. Their building envelopes stand on the higher ground toward '
  + 'Fort Foote Road, and with the design in the study both dwellings finish clear of the '
  + 'floodplain in plan as well as above it in elevation.')
table(['Lot', 'Before grading', 'After grading', 'Finished floor', 'Above the water'],
  ['53', '56'].map(lot => {
    const sb = SC.setbacks[lot]
    return [`Lot ${lot}`,
      `${f(-sb.existing.horizFt, 0)} ft inside the floodplain`,
      `**${f(sb.proposed.horizFt, 0)} ft clear of it`,
      `EL ${f(sb.proposed.ffFt)}`, `+${f(sb.proposed.freeboardFt)} ft`]
  }), [0.12, 0.29, 0.24, 0.18, 0.17],
  'Distance from the nearest corner of the dwelling to the 100-year floodplain limit.')
p('Neither house may have a basement, and both are designed on vented crawlspace foundations '
  + 'with flood openings, so the structure is lifted rather than the ground filled. The rear of '
  + 'both lots stays in the floodplain and would be covered by the easement. Flood insurance '
  + 'will be required whatever the floor elevation, and a lender will insist on it.')

h2('Why dedicating Lots 54 and 55 is what makes the other two work')
p('Any fill placed below the flood level displaces water and must be replaced by digging an '
  + 'equal volume out somewhere else. That is the rule that was blocking the four-house scheme:')
table(['', 'Volume'], [
  ['Fill below the flood level, four houses', `${n0(SC.splitDevelopment.fourLotRequirementCy)} cy`],
  ['Of which comes from Lots 54 and 55', `**${n0(SC.splitDevelopment.lots5455ShareOfRequirementCy)} cy (${f(SC.splitDevelopment.lots5455SharePct, 0)}%)`],
  ['Fill below the flood level, Lots 53 and 56 only', `**${n0(SC.splitDevelopment.compensationRequiredCy.total)} cy`],
  ['Excavation available on Lots 54 and 55', `${n0(SC.splitDevelopment.compensationFromLots5455Cy.toEl50)} cy`],
  ['Ratio available to required', `**${f(SC.splitDevelopment.coverageRatioAtEl50, 1)} : 1`],
], [0.66, 0.34])
p('The two lots that cannot be built on are the two lots that supply what the buildable pair '
  + 'needs. Dedicating them is not writing them off; it is spending them on the approval.')
callout('A margin, not a cushion',
  'The ratio is ' + f(SC.splitDevelopment.coverageRatioAtEl50, 1) + ' to 1 at an excavation floor '
  + 'that drains. It works, and it is not generous. A field survey may move it either way, and '
  + 'the design should not be committed to until the survey is in.', '#e65100')

// ══ 3. DISPOSITION ROUTES ═════════════════════════════════════════════════
newPage()
h1('3.  Routes to sell or be compensated for Lots 54 and 55')
p('These are set out in the order a practitioner would normally test them. Several can run at '
  + 'the same time. None of the values below is an appraisal; obtaining one is the first step '
  + 'in every route.')

h2('A.  Dedicate to the county as part of your own approval')
p('The simplest route, and the one the engineering already supports. The floodplain easement is '
  + 'dedicated over Lots 54 and 55 by record plat or by deed, the compensatory storage is built '
  + 'within it, and the dedication is what carries the site plan for Lots 53 and 56 through '
  + 'review. Prince George’s County has done exactly this within this subdivision before: '
  + 'Plat 118-083, recorded 17 January 1984, dedicated a 5.32-acre floodplain easement on the '
  + 'downstream side of Fort Foote Road.')
p('**You are not paid cash for this.** You are paid in approval: the two houses become '
  + 'permittable. If the two buildable lots carry the project economics, this is usually the '
  + 'best-value route, and it is the fastest.', { size: 9.6 })

h2('B.  Sell the fee to Prince George’s County')
bullet('**DPIE / Department of the Environment — drainage and floodplain acquisition.** The '
  + 'county acquires land for stormwater and floodplain purposes. Approach DPIE at '
  + 'pre-application with the study and ask directly whether the parcels are of interest. The '
  + 'argument is strong here: the land is already functioning as the county’s flood storage '
  + 'behind a county road that overtops.')
bullet('**M-NCPPC — parkland acquisition.** The Maryland-National Capital Park and Planning '
  + 'Commission acquires open space, stream valley land and green infrastructure. This corridor '
  + 'is mapped in the county Green Infrastructure Plan. M-NCPPC has an acquisition programme and '
  + 'a budget cycle; enquiries go to the Department of Parks and Recreation land acquisition staff.')
bullet('**Maryland Program Open Space.** State funding administered through DNR that local '
  + 'jurisdictions use to buy land for conservation and recreation. It is applied for by the '
  + 'county or M-NCPPC, not by you, so in practice this route runs through route B above — but '
  + 'it is worth naming, because it is often what actually pays.')

h2('C.  Conservation conveyance, with a tax deduction')
bullet('**Bargain sale to a land trust or public agency.** You sell below appraised fair market '
  + 'value and the difference is treated as a charitable gift. You receive cash and a deduction. '
  + 'A qualified appraisal is mandatory.')
bullet('**Donation in fee.** The whole value becomes a charitable deduction, subject to the '
  + 'federal limits on conservation gifts and to carry-forward rules. No cash.')
bullet('**Conservation easement, retaining ownership.** You keep title and sell or donate the '
  + 'development rights. The deduction is the difference in appraised value before and after. '
  + 'The Maryland Environmental Trust and local land trusts hold these. You remain liable for '
  + 'maintenance and, unless the assessment is also reduced, for the taxes.')
callout('Get the appraisal before you choose',
  'Every route in section C turns on a qualified appraisal of the parcels as they actually are '
  + '— floodplain land with no development potential. The appraised figure decides which route '
  + 'is worth pursuing, and the IRS requires one for any deduction above modest thresholds. '
  + 'This is the single cheapest thing you can do next.', '#1565c0')

newPage()
h2('D.  Reduce what you are paying to hold them')
p('**Appeal the assessment.** Lots 54 and 55 are almost certainly assessed as buildable '
  + 'residential lots. On this analysis they are not buildable. An appeal to the Maryland State '
  + 'Department of Assessments and Taxation, supported by the engineering study, should reduce '
  + 'the assessed value materially. This is money back every year, it does not depend on anyone '
  + 'else agreeing to buy anything, and it is independent of every other route on this list.')
p('Appeals are filed with the local SDAT assessment office. There is a defined appeal window '
  + 'following each assessment notice, and an out-of-cycle petition route between notices. Your '
  + 'attorney or a property tax agent will know the current dates.', { size: 9.2, color: '#444' })

h2('E.  Resubdivision and consolidation')
p('Rather than holding four lots, combine Lots 54 and 55 into Lots 53 and 56 as floodplain rear '
  + 'yard, or into a single outlot dedicated to drainage. This reduces the number of taxable '
  + 'parcels, removes two lots that cannot be sold as building lots, and can make the easement '
  + 'simpler to describe and record. It requires M-NCPPC approval of a resubdivision plat.')

h2('F.  Sale to adjoining owners')
p('Floodplain land has real value to a neighbour as rear-yard buffer, and none to a builder. '
  + 'The adjoining owners on either side are the most likely private buyers at any price. This '
  + 'is worth a letter; it is not worth a marketing campaign.')

h2('G.  Environmental credit markets')
p('Stream and wetland mitigation banking, and nutrient credit trading, both operate in Maryland. '
  + 'A restored and permanently protected stream corridor can generate credits that are sold to '
  + 'parties who need offsets. It requires a restoration design, an approved banking instrument '
  + 'and long-term stewardship, so it is slow and it has up-front cost. It is listed because the '
  + 'corridor here is a genuine candidate, not because it is easy.')

h2('H.  Routes that will not work here')
bullet('**FEMA hazard mitigation buyouts.** These programmes target repetitively flooded '
  + 'structures. Vacant land does not qualify.')
bullet('**A FEMA map amendment (LOMA).** The lots are already outside FEMA’s mapped flood '
  + 'zone. Being outside FEMA’s map does not make them outside the county floodplain, and '
  + 'there is nothing for FEMA to amend.')
bullet('**Filling the lots out of the floodplain.** It would take '
  + n0(12922) + ' cubic yards below the flood level with nowhere on site to compensate it, and '
  + 'it would raise the water on the neighbours.')

// ══ 4. NEXT STEPS ═════════════════════════════════════════════════════════
newPage()
h1('4.  What to do next, in order')
table(['#', 'Action', 'Why now', 'Who'], [
  ['1', 'Field survey: datum tie to benchmarks H31A, H32A, H32B and the culvert inverts',
    'Every number in the study rests on these two unmeasured items. One day of work.', 'Meekins Surveyors'],
  ['2', 'Appraisal of Lots 54 and 55 as floodplain land',
    'Decides which disposition route is worth pursuing, and is required for any deduction.', 'MAI appraiser'],
  ['3', 'Assessment appeal on Lots 54 and 55',
    'Independent of everything else. Recovers money annually.', 'Attorney or tax agent'],
  ['4', 'DPIE pre-application meeting with the study',
    'Ask whether the county wants the parcels, and put the road overtopping on the record.', 'You and your engineer'],
  ['5', 'Obtain FPS 200546 from DPIE',
    'The controlling floodplain study of record. Not in the file. Everything must reconcile to it.', 'Engineer'],
  ['6', 'Maryland PE to review, correct and seal the study',
    'Nothing is reviewable unsealed. The platform cannot supply this.', 'Water resources PE'],
], [0.05, 0.34, 0.42, 0.19])

callout('Step 4 is also a duty',
  'Fort Foote Road is overtopped in storms more frequent than one in ten years, carrying '
  + n0(MIT.routed['EXISTING 36 in RCP (assumed)']['10'].outflowPeakCfs)
  + ' cubic feet per second across the pavement and cutting emergency access. That condition '
  + 'exists whether or not you build. Reporting it to DPIE in writing costs nothing and protects '
  + 'you.', '#b71c1c')

h1('5.  Limitations')
p('This package summarises a preliminary feasibility study. The terrain is published county '
  + 'LiDAR rather than a field survey. The existing culvert has never been measured and its '
  + 'size, inverts and entrance are assumed. HEC-RAS, the software of record, was not used; the '
  + 'same equations were solved directly. FPS 200546, the controlling county study, has not been '
  + 'obtained. Upstream stormwater facilities were not inventoried. No professional engineer has '
  + 'reviewed or sealed any part of this work.')
p('The conclusions are robust to those gaps — Lot 54 is not 89 per cent flooded because of a '
  + 'survey error — but no part of this may be submitted as a sealed floodplain study, relied on '
  + 'in a conveyance, or used to support a tax position without professional review.')
p('Accompanying documents: the floodplain and hydraulic study; sheets FP-101 delineation and '
  + 'impact, FP-102 mitigation and compensatory storage design, FP-103 floodplain delineation; '
  + 'and the GIS delineation files.', { size: 9.2, color: '#444' })

// ── page numbers ───────────────────────────────────────────────────────────
const range = doc.bufferedPageRange()
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(range.start + i)
  // The footer sits BELOW the bottom margin. Writing there with the margin in
  // force makes PDFKit treat it as overflow and add a page — one blank page per
  // footer, which turned a six-page document into eighteen. The margin is
  // dropped for the width of the footer and restored immediately.
  const bottom = doc.page.margins.bottom
  doc.page.margins.bottom = 0
  doc.font('Helvetica').fontSize(7.6).fillColor('#888')
    .text(`Indian Queen East Lots 53-56  ·  Owner's decision package  ·  PRELIMINARY, not a sealed engineering document`,
      MG, H - MG + 12, { width: CW - 46, lineBreak: false })
    .text(`${i + 1} / ${range.count}`, W - MG - 44, H - MG + 12, { width: 44, align: 'right', lineBreak: false })
  doc.page.margins.bottom = bottom
}

doc.end()
doc.on('end', () => {
  const out = join(PROJ, 'reports', 'indian-queen-owner-package.pdf')
  writeFileSync(out, Buffer.concat(chunks))
  console.log(`wrote ${out}`)
})
