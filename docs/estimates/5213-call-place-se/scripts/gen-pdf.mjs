/**
 * gen-pdf.mjs — build a print-ready HTML estimate breakdown from the validated
 * JSON exports (estimate.json + estimate-ctc.json). Render to PDF with:
 *   chrome --headless --print-to-pdf=estimate.pdf estimate.html
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../output');
const J = JSON.parse(fs.readFileSync(path.join(OUT, 'estimate.json'), 'utf8'));
const CTCJ = JSON.parse(fs.readFileSync(path.join(OUT, 'estimate-ctc.json'), 'utf8'));
const A = J.scenarios.A, B = J.scenarios.B, C = J.scenarios.C;

const m0 = (n) => '$' + Math.round(n).toLocaleString();
const m2 = (n) => '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const psf = (n) => '$' + n.toFixed(0) + '/SF';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const elevatorTotal = J.exclusions.elevatorTotal, kitchenTotal = J.exclusions.kitchenTotal;

// ── Division summary rows (A/B/C) ───────────────────────────────────────────
const divRows = A.divs.map((d, i) => `<tr>
  <td class="c">${d.num}</td><td>${esc(d.name)}</td>
  <td class="r">${m0(d.total)}</td><td class="r">${m0(B.divs[i].total)}</td><td class="r">${m0(C.divs[i].total)}</td>
  <td class="r dim">${Math.round(d.hrs).toLocaleString()}</td></tr>`).join('');

// ── Line-item detail (Scenario A) ───────────────────────────────────────────
const lineTables = A.divs.map((d) => {
  const rows = d.lines.map((ln) => `<tr class="${ln.allowance ? 'allow' : ''}">
    <td>${esc(ln.name)}</td>
    <td class="c mono">${esc(ln.code)}</td>
    <td class="c">${esc(ln.unit)}</td>
    <td class="r">${ln.qty.toLocaleString()}</td>
    <td class="r">${m2(ln.matUnit)}</td>
    <td class="r">${m2(ln.labUnit)}</td>
    <td class="r">${ln.subUnit ? m2(ln.subUnit) : ln.equipUnit ? m2(ln.equipUnit) : '—'}</td>
    <td class="c">${ln.conf}</td>
    <td class="r b">${m0(ln.ext.total)}</td></tr>`).join('');
  return `<table class="lines"><thead>
    <tr><th colspan="9" class="divhead">DIVISION ${d.num} — ${esc(d.name)} &nbsp;·&nbsp; ${m0(d.total)}</th></tr>
    <tr><th>Item</th><th>Code</th><th>Unit</th><th class="r">Qty</th><th class="r">Mat/u</th><th class="r">Lab/u</th><th class="r">Sub·Eq/u</th><th>Conf</th><th class="r">Extended</th></tr>
    </thead><tbody>${rows}</tbody></table>`;
}).join('');

// ── Exclusions ──────────────────────────────────────────────────────────────
const exRows = (arr) => arr.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="r">${m0(v)}</td></tr>`).join('');

// ── Owner summary ───────────────────────────────────────────────────────────
const o = J.ownerSummary;

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Estimate — 5213 Call Place SE</title>
<style>
  * { box-sizing: border-box; }
  body { font: 11px/1.45 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a2230; margin: 0; }
  .page { padding: 28px 34px; }
  h1 { font-size: 21px; margin: 0 0 2px; }
  h2 { font-size: 14px; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #204020; color: #16321a; }
  h3 { font-size: 12px; margin: 14px 0 5px; color: #33475b; }
  .sub { color: #5a6b7b; font-size: 11px; }
  .banner { background: #16321a; color: #fff; padding: 14px 18px; border-radius: 6px; margin: 10px 0 4px; }
  .banner .big { font-size: 20px; font-weight: 700; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0 10px; }
  th, td { padding: 3px 7px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
  th { background: #f1f5f2; font-size: 10px; text-transform: uppercase; letter-spacing: .3px; color: #445; }
  .r { text-align: right; } .c { text-align: center; } .b { font-weight: 700; } .dim { color: #889; }
  .mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 9.5px; }
  .kpi { display: flex; gap: 10px; flex-wrap: wrap; margin: 8px 0; }
  .kpi div { flex: 1; min-width: 120px; background: #f7faf7; border: 1px solid #dfeadf; border-radius: 5px; padding: 8px 10px; }
  .kpi .n { font-size: 16px; font-weight: 700; color: #16321a; } .kpi .l { font-size: 9.5px; color: #667; text-transform: uppercase; }
  tr.allow td { background: #fff8ec; }
  tr.allow td.mono { color: #a15c00; font-weight: 600; }
  .lines { page-break-inside: auto; font-size: 10px; }
  .lines .divhead { background: #204020; color: #fff; font-size: 11px; text-transform: none; letter-spacing: 0; }
  .warn { background: #fff4f4; border: 1px solid #f2c7c7; border-radius: 5px; padding: 9px 12px; font-size: 10.5px; color: #7a2b2b; margin: 8px 0; }
  .note { font-size: 10px; color: #5a6b7b; }
  .legend { font-size: 9.5px; color: #888; margin-top: 4px; }
  .swatch { display:inline-block; width:10px; height:10px; background:#fff8ec; border:1px solid #e3b667; vertical-align:middle; margin-right:3px; }
  @media print { h2 { page-break-after: avoid; } table { page-break-inside: auto; } tr { page-break-inside: avoid; } .pb { page-break-before: always; } }
  @page { margin: 12mm 10mm; size: letter; }
  .foot { margin-top: 14px; font-size: 9px; color: #99a; border-top: 1px solid #e2e8f0; padding-top: 6px; }
</style></head><body><div class="page">

<h1>Construction Estimate — Breakdown</h1>
<div class="sub"><b>5213 Call Place SE, Washington DC 20019</b> · New-construction detached group home / residential care (R-2), Type IIIB · Cellar + 3 stories · ${o.gsf.toLocaleString()} GSF · ${o.bedrooms} BR / ${o.beds} beds / ${o.bathrooms} baths / 1 commercial kitchen / 1 elevator</div>
<div class="sub">Priced through the Kealee catalogue (packages/estimating, DC factor 1.15) · Markups OH 12% / Profit 15% / Contingency 7% · Generated ${new Date(J.meta.generated).toISOString().slice(0, 10)}</div>

<div class="warn"><b>Basis of estimate.</b> No permit drawings were available — <b>no measured takeoff</b> was performed. All quantities are calculated from the stated building basis or assumed as gross-area allowances (confidence LOW–MED). 66 of 106 line items are labeled temporary allowances for institutional scope the catalogue does not carry. Not persisted to a database (no DATABASE_URL in the run environment).</div>

<div class="banner"><span class="big">Recommended target: ${psf(C.psf)}–$300/SF &nbsp; (${m0(C.total)}–$1.78M base building)</span><br>
<span style="font-size:11px">The $170/SF ($1,006,400) target is <b>not achievable</b> for a cellar+3, elevatored, sprinklered, masonry R-2 group home in DC without deleting code-required life-safety, accessibility, or structural scope.</span></div>

<h2>Executive summary — scenario comparison</h2>
<table>
<thead><tr><th>Scenario</th><th class="r">Total (excl. elevator + kitchen equip)</th><th class="r">$/GSF</th><th class="r">$/bed</th><th class="r">vs $170/SF</th></tr></thead>
<tbody>
<tr><td><b>A — Catalogue Market</b></td><td class="r b">${m0(A.total)}</td><td class="r">${psf(A.psf)}</td><td class="r">${m0(A.total / o.beds)}</td><td class="r">+${((A.psf / 170 - 1) * 100).toFixed(0)}%</td></tr>
<tr><td><b>B — Value-Engineered</b></td><td class="r b">${m0(B.total)}</td><td class="r">${psf(B.psf)}</td><td class="r">${m0(B.total / o.beds)}</td><td class="r">+${((B.psf / 170 - 1) * 100).toFixed(0)}%</td></tr>
<tr><td><b>C — Minimum Viable</b></td><td class="r b">${m0(C.total)}</td><td class="r">${psf(C.psf)}</td><td class="r">${m0(C.total / o.beds)}</td><td class="r">+${((C.psf / 170 - 1) * 100).toFixed(0)}%</td></tr>
<tr><td class="dim">Target</td><td class="r dim">${m0(J.target.total)}</td><td class="r dim">$170/SF</td><td class="r dim">${m0(J.target.total / o.beds)}</td><td class="r dim">—</td></tr>
</tbody></table>
<div class="note"><b>CTC cross-check:</b> the same takeoff priced against the Construction Task Catalog (data/ctc) totals <b>${m0(CTCJ.totals.total)} (${psf(CTCJ.totals.psf)})</b> — within <b>${((CTCJ.totals.total / A.total - 1) * 100).toFixed(1)}%</b> of Scenario A. Only <b>${CTCJ.totals.coveragePct}%</b> of direct cost maps to a real CTC task (41-task sample); the rest is allowance.</div>

<h2>Scenario A — cost build-up</h2>
<div class="kpi">
  <div><div class="l">Direct construction</div><div class="n">${m0(A.direct)}</div></div>
  <div><div class="l">Material</div><div class="n">${m0(A.material)}</div></div>
  <div><div class="l">Labor</div><div class="n">${m0(A.labor)}</div></div>
  <div><div class="l">Subcontractor</div><div class="n">${m0(A.subcontractor)}</div></div>
  <div><div class="l">Labor-hours</div><div class="n">${Math.round(A.laborHours).toLocaleString()}</div></div>
</div>
<table style="max-width:420px">
<tr><td>Direct construction</td><td class="r">${m0(A.direct)}</td></tr>
<tr><td>GC overhead (12%)</td><td class="r">${m0(A.overhead)}</td></tr>
<tr><td>GC profit (15%)</td><td class="r">${m0(A.profit)}</td></tr>
<tr><td>Contingency (7%)</td><td class="r">${m0(A.contingency)}</td></tr>
<tr><td>Bonds &amp; insurance (1.5%)</td><td class="r">${m0(A.bondsIns)}</td></tr>
<tr><td>Permit allowance (DCRA)</td><td class="r">${m0(A.permit)}</td></tr>
<tr class="b"><td>TOTAL (excl. elevator + kitchen equip)</td><td class="r">${m0(A.total)}</td></tr>
</table>

<h2>CSI division summary</h2>
<table>
<thead><tr><th class="c">Div</th><th>Description</th><th class="r">Scenario A</th><th class="r">Scenario B</th><th class="r">Scenario C</th><th class="r">A lab-hrs</th></tr></thead>
<tbody>${divRows}
<tr class="b"><td></td><td>Direct construction</td><td class="r">${m0(A.direct)}</td><td class="r">${m0(B.direct)}</td><td class="r">${m0(C.direct)}</td><td class="r">${Math.round(A.laborHours).toLocaleString()}</td></tr>
</tbody></table>

<h2>Excluded-cost schedule <span class="sub">(NOT in any total above — owner procures separately)</span></h2>
<h3>Elevator — ${m0(elevatorTotal)} allowance</h3>
<table style="max-width:460px">${exRows(J.exclusions.elevator)}<tr class="b"><td>Elevator total</td><td class="r">${m0(elevatorTotal)}</td></tr></table>
<div class="note">Included in base building: elevator pit (Div 03), hoistway shaft framing + 2-hr rated enclosure (Div 06), power rough-in &amp; disconnect (Div 26).</div>
<h3>Commercial kitchen equipment — ${m0(kitchenTotal)} allowance</h3>
<table style="max-width:460px">${exRows(J.exclusions.kitchen)}<tr class="b"><td>Kitchen equipment total</td><td class="r">${m0(kitchenTotal)}</td></tr></table>
<div class="note">Included in base building: kitchen plumbing/gas rough-in (Div 22), electrical rough-in (Div 26), hood curb + exhaust/MUA ductwork (Div 23), kitchen wall/floor/ceiling finishes (Div 09).</div>

<h2>Owner cash-flow summary <span class="sub">(Scenario A base building)</span></h2>
<div class="kpi">
  <div><div class="l">Base building</div><div class="n">${m0(o.recommendedBaseBuilding)}</div></div>
  <div><div class="l">Per GSF</div><div class="n">${psf(o.costPerGSF)}</div></div>
  <div><div class="l">Per bed (${o.beds})</div><div class="n">${m0(o.costPerBed)}</div></div>
  <div><div class="l">Per bedroom (${o.bedrooms})</div><div class="n">${m0(o.costPerBedroom)}</div></div>
  <div><div class="l">Per bathroom (${o.bathrooms})</div><div class="n">${m0(o.costPerBathroom)}</div></div>
</div>
<table style="max-width:520px">
<tr><td>Base-building construction (excl. elevator + kitchen equip)</td><td class="r b">${m0(o.recommendedBaseBuilding)}</td></tr>
<tr><td>Separate elevator allowance</td><td class="r">${m0(o.elevatorAllowanceSeparate)}</td></tr>
<tr><td>Separate kitchen-equipment allowance</td><td class="r">${m0(o.kitchenEquipmentAllowanceSeparate)}</td></tr>
<tr class="b"><td>All-in incl. excluded allowances</td><td class="r">${m0(o.allInWithExcludedAllowances)}</td></tr>
</table>

<h2 class="pb">Detailed line-item breakdown — Scenario A</h2>
<div class="legend"><span class="swatch"></span> shaded rows = labeled temporary allowance (no catalogue assembly). Code column shows the Kealee catalogue code or ALLOWANCE. Sub·Eq/u = subcontractor or equipment unit cost.</div>
${lineTables}

<div class="foot">
Kealee Platform · Estimate generated from packages/estimating catalogue (MARKETPLACE_ASSEMBLIES, DC-Baltimore 2024-25, DC region factor 1.15) and cross-checked against the Construction Task Catalog (data/ctc, DMV-2026). Planning-grade estimate: quantities assumed/calculated (no measured takeoff), ±25–35% likely until a drawing-based takeoff is performed. Not a bid. Elevator and commercial-kitchen equipment excluded from all base totals and scheduled separately.
</div>

</div></body></html>`;

fs.writeFileSync(path.join(OUT, 'estimate.html'), html);
console.log('Wrote output/estimate.html (' + html.length + ' bytes)');
