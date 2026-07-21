import fs from 'node:fs/promises';
import path from 'node:path';

const outDir = path.resolve('outputs');
await fs.mkdir(outDir, { recursive: true });

const money = (n) => Math.round(n);
const fmt = (n) => `$${money(n).toLocaleString('en-US')}`;
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const csv = (rows) => rows.map((row) => row.map((v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(',')).join('\n') + '\n';

const catalogSources = [
  'Construction Task Catalog(R) - Distribution.pdf, Maryland Department of General Services - Central, June 2023, 4,666 pages, text extraction permitted despite Standard security filter.',
  'Using The Construction Task Catalog(R) - Distribution.pdf, June 2023: CTC was locally priced using current labor, material, and equipment costs; unit prices are complete in-place direct construction costs.',
  'Using guide: labor includes straight-time prevailing wage direct labor through working foreperson, fringes, workers compensation, unemployment, and employee benefits.',
  'Using guide: material includes delivery and incidentals integral to installation; equipment includes operating expenses; large equipment mobilization is excluded unless separately tasked.',
  'Using guide: adjustment factors include office overhead, insurance/bonding, profit, subcontractor overhead/profit, financing, project trailer, project management/supervision, permits support, safety, daily and final cleanup.',
];

const program = {
  project: 'Argona Hills / Gunpowder Plaza Mixed-Use Development',
  location: 'Fort Washington, Prince George County, MD 20744',
  landCost: 7_100_000,
  landAcres: 28,
  baseUnits: 450,
  listedUnits: [
    { type: '1BR', units: 92, nsf: 750 },
    { type: '2BR', units: 194, nsf: 980 },
    { type: '3BR', units: 84, nsf: 1200 },
  ],
  commercialBase: 99_000,
  commercialHigh: 150_000,
  garageStallsBase: 400,
  garageStallGsf: 365,
  surfaceStalls: 185,
  surfaceStallSf: 330,
  residentialEfficiency: 0.805,
};

const listedUnitCount = program.listedUnits.reduce((s, u) => s + u.units, 0);
const listedNsf = program.listedUnits.reduce((s, u) => s + u.units * u.nsf, 0);
const blendedNsf = listedNsf / listedUnitCount;
const residentialNsf = blendedNsf * program.baseUnits;
const residentialGsf = residentialNsf / program.residentialEfficiency;
const garageGsf = program.garageStallsBase * program.garageStallGsf;
const surfaceSf = program.surfaceStalls * program.surfaceStallSf;
const buildingGsfBase = residentialGsf + program.commercialBase;
const totalGsfBase = buildingGsfBase + garageGsf;

const escalation = {
  low: 1.105,
  base: 1.15,
  high: 1.205,
  mepBase: 1.17,
  concreteSteelBase: 1.14,
};
const locationFactor = 1.04;
const gcOpBase = 0.10;
const genConditionsRate = 0.08;
const contingencyBase = 0.10;

const divisions = [
  ['01', 'General Requirements', 'CTC Div 01 temporary facilities, construction aids, access, barriers, cleaning; Using guide says project supervision/trailer/cleanup are in adjustment factor, so modeled separately as general conditions.', 'Adjusted direct hard cost subtotal', 0.08, 1.12, 'Medium', 'Separate from GC O&P; includes superintendent, PM/APM, safety, trailer, temp utilities, toilets, dumpsters, testing coordination, insurance/bond allowance where applicable.'],
  ['02', 'Existing Conditions / Demo', 'CTC Div 02 demolition/removal tasks; demolition tasks exclude hauling, dump fees, dumpsters and trash chutes unless separately tasked.', '20 disturbed acres / minor existing improvements', 75000, 1.10, 'Low', 'No demolition survey provided; environmental and hazmat excluded except allowances.'],
  ['03', 'Concrete', 'CTC Div 03 cast-in-place concrete, reinforcing, forms, finishing; Div 01 wage examples include cement mason $48.16/hr and rodman/reinforcing steel worker $67.58/hr.', `${buildingGsfBase.toFixed(0)} building GSF + ${garageGsf.toFixed(0)} garage GSF`, 46, escalation.concreteSteelBase, 'Medium', 'Podium/slab/garage concrete calibrated conceptually; final depends on structural system, foundations, podium transfer, and below-grade parking.'],
  ['04', 'Masonry', 'CTC Div 04 concrete unit masonry and masonry assemblies.', `${buildingGsfBase.toFixed(0)} building GSF`, 6, 1.13, 'Medium', 'CMU cores, shafts, veneer/site walls allowance.'],
  ['05', 'Metals', 'CTC Div 05 structural steel framing, joists, decking, railings, miscellaneous metals; wage example structural steel worker $72.32/hr.', `${buildingGsfBase.toFixed(0)} building GSF + garage metals`, 22, escalation.concreteSteelBase, 'Medium', 'Includes miscellaneous metals and structural steel allowance for podium/hybrid; wide range pending structural design.'],
  ['06', 'Wood, Plastics, Composites', 'CTC Div 06 wood framing, sheathing, architectural woodwork/casework; wage example carpenter $58.03/hr.', `${residentialGsf.toFixed(0)} residential GSF`, 31, 1.13, 'Medium', 'Wood-frame/wrap residential superstructure assumed above podium; mass timber or full concrete/steel would change this materially.'],
  ['07', 'Thermal and Moisture Protection', 'CTC Div 07 waterproofing, insulation, roofing, air barriers, sealants.', `${buildingGsfBase.toFixed(0)} building GSF`, 21, 1.14, 'Medium', 'Podium waterproofing, roof membrane, exterior insulation, air/water barrier.'],
  ['08', 'Openings', 'CTC Div 08 doors, storefronts, glazing; sample aluminum entrance door task 08 42 13 00-0002 at $5,739.41 direct plus demolition column $490.38.', `${buildingGsfBase.toFixed(0)} building GSF`, 26, 1.13, 'Medium', 'Residential windows, storefront, doors, hardware; curtainwall-heavy design would increase.'],
  ['09', 'Finishes', 'CTC Div 09 finishes and residential finish assemblies; residential paint noted per SF floor area in Div 01 residential section.', `${residentialGsf.toFixed(0)} residential GSF + commercial warm shell`, 38, 1.12, 'Medium', 'Apartment finishes, corridors, amenity finishes, commercial shell only. Tenant improvements excluded beyond warm shell.'],
  ['10', 'Specialties', 'CTC Div 10 specialties and toilet accessories; residential specialties cross-reference Div 10 28.', `${program.baseUnits} units + common areas`, 4200, 1.11, 'Medium', 'Bath accessories, signage, lockers/mailboxes, fire extinguisher cabinets, misc specialties.'],
  ['11', 'Equipment', 'CTC Div 11 residential appliances and foodservice/equipment sections.', `${program.baseUnits} dwelling units`, 6800, 1.12, 'Medium', 'Appliance package and common equipment; restaurant/retail tenant equipment excluded.'],
  ['12', 'Furnishings', 'CTC Div 12 furnishings, window treatments, countertops where applicable.', `${program.baseUnits} units + amenities`, 3200, 1.10, 'Low', 'Amenity FF&E and blinds allowance; owner-procured items may shift to soft costs.'],
  ['13', 'Special Construction', 'CTC Div 13 special construction.', 'Allowance', 900000, 1.11, 'Low', 'Canopies, pool/special amenity, specialty structures not yet designed.'],
  ['14', 'Conveying Equipment / Elevators', 'CTC Div 14 traction and hydraulic elevators.', '6 elevator stops/cabs allowance', 325000, 1.13, 'Medium', 'Assumes multiple residential/commercial/garage elevator cores; final count and travel height needed.'],
  ['21', 'Fire Suppression', 'CTC Div 21 wet-pipe sprinkler systems; complete wet pipe tasks include NFPA design/shop drawings, branch lines, fittings, hangers, sprinkler heads, excluding mains/standpipes/fire pumps/tanks.', `${totalGsfBase.toFixed(0)} total enclosed/garage GSF`, 5.4, escalation.mepBase, 'Medium', 'Includes sprinkler distribution; fire pump, tanks, standpipes carried in allowance if required.'],
  ['22', 'Plumbing', 'CTC Div 22 plumbing; sample 22 41 13 13-0002 Kohler Wellworth toilet at $410.30 direct plus $133.35 demolition column.', `${program.baseUnits} units + commercial/common`, 20500, escalation.mepBase, 'Medium', 'Domestic water, sanitary, storm, fixtures, water heaters/booster allowance; utility connection fees excluded from hard cost.'],
  ['23', 'HVAC', 'CTC Div 23 HVAC; sample packaged rooftop task 23 74 16 13-0002 2-ton electric cooling/electric heat RTU at $4,360.51 direct plus $1,265.91 demolition column.', `${buildingGsfBase.toFixed(0)} building GSF`, 34, escalation.mepBase, 'Medium', 'VRF/PTAC/DOAS not selected; MEP design can swing materially.'],
  ['26', 'Electrical', 'CTC Div 26 electrical distribution, panelboards, devices; wage example electrician $77.69/hr.', `${buildingGsfBase.toFixed(0)} building GSF + garage/site lighting`, 29, escalation.mepBase, 'Medium', 'Service, distribution, lighting, devices, EV rough-ins allowance; utility company work excluded.'],
  ['27', 'Low Voltage / Communications', 'CTC Div 27 communications systems.', `${buildingGsfBase.toFixed(0)} building GSF`, 4.5, 1.15, 'Low', 'Backbone, structured cabling, telecom rooms, access control rough-ins coordination.'],
  ['28', 'Electronic Safety and Security', 'CTC Div 28 alarms/security; residential alarm tasks visible in Div 01 residential electrical cross-references.', `${buildingGsfBase.toFixed(0)} building GSF + garage`, 4.7, 1.15, 'Medium', 'Fire alarm, CCTV/access/security; scope depends on owner/lender/security requirements.'],
  ['31', 'Earthwork', 'CTC Div 31 earthwork; Div 00 provides material weights/shrink-swell conversion rules for earth, sand, rock mixes, gravel and clay.', `${program.landAcres} acres; assume 20 disturbed acres`, 180000, 1.13, 'Low', 'Clearing, grading, erosion control, excavation/backfill. Rock, unsuitable soils, retaining walls and export/import are major unknowns.'],
  ['32', 'Exterior Improvements', 'CTC Div 32 paving and exterior improvements; sample asphalt grinding/reuse tasks in Div 32 range from $4.52/SY to $7.49/SY for listed rehab items.', `${surfaceSf.toFixed(0)} SF surface parking + roads/sidewalks/landscape`, 145000, 1.12, 'Low', 'Roads, sidewalks, curb/gutter, surface lots, lighting, landscape, hardscape.'],
  ['33', 'Utilities', 'CTC Div 33 utilities, stormwater conveyance, storm utility drains, stormwater management, hydrocarbon utilities.', 'Water/sewer/storm/dry utility site allowance', 6500000, 1.15, 'Low', 'Off-site upgrades, WSSC/utility requirements, stormwater BMPs and dry utility relocation unknown.'],
];

const divRows = [];
let adjustedDirectExcl01 = 0;
for (const d of divisions) {
  const [code, name, basis, qtyBasis, unitCost2023, esc, confidence, notes] = d;
  let qty = 1;
  if (code === '03') qty = buildingGsfBase + garageGsf;
  else if (['04', '07', '08', '23', '26', '27', '28'].includes(code)) qty = buildingGsfBase;
  else if (code === '05') qty = buildingGsfBase + garageGsf * 0.35;
  else if (code === '06') qty = residentialGsf;
  else if (code === '09') qty = residentialGsf + program.commercialBase * 0.45;
  else if (['10', '11', '12'].includes(code)) qty = program.baseUnits;
  else if (code === '13') qty = 1;
  else if (code === '14') qty = 6;
  else if (code === '21') qty = totalGsfBase;
  else if (code === '22') qty = program.baseUnits;
  else if (code === '31') qty = program.landAcres;
  else if (code === '32') qty = program.landAcres;
  else if (code === '33') qty = 1;
  else if (code === '02') qty = program.landAcres;
  if (code !== '01') {
    const adjUnit = unitCost2023 * esc * locationFactor;
    const ext = qty * adjUnit;
    adjustedDirectExcl01 += ext;
    divRows.push({ code, name, basis, escalation: esc, qtyBasis, qty, unitCost2023, unitCost2026: adjUnit, ext, confidence, notes });
  }
}
const div01Ext = adjustedDirectExcl01 * genConditionsRate;
divRows.unshift({
  code: '01',
  name: 'General Requirements',
  basis: divisions[0][2],
  escalation: divisions[0][5],
  qtyBasis: divisions[0][3],
  qty: adjustedDirectExcl01,
  unitCost2023: divisions[0][4],
  unitCost2026: genConditionsRate,
  ext: div01Ext,
  confidence: 'Medium',
  notes: divisions[0][7],
});

const adjustedDirect = adjustedDirectExcl01 + div01Ext;
const gcOp = adjustedDirect * gcOpBase;
const contingency = (adjustedDirect + gcOp) * contingencyBase;
const hardCostBase = adjustedDirect + gcOp + contingency;
const hardLow = hardCostBase * 0.88;
const hardHigh = hardCostBase * 1.18;

const softCostRows = [
  ['Land', 'Known acquisition basis', program.landCost],
  ['Architecture / design', '4.2% of hard cost', hardCostBase * 0.042],
  ['Civil engineering', '0.8% of hard cost', hardCostBase * 0.008],
  ['Structural engineering', '0.6% of hard cost', hardCostBase * 0.006],
  ['MEP engineering', '0.9% of hard cost', hardCostBase * 0.009],
  ['Geotech / environmental / survey / ALTA', 'Allowance', 900000],
  ['Legal / zoning / entitlement', 'Allowance', 1_600_000],
  ['Permits / impact / utility connection fees', '4.0% of hard cost', hardCostBase * 0.04],
  ['Insurance / taxes during construction', '1.1% of hard cost', hardCostBase * 0.011],
  ['Appraisal / third-party / lender legal', 'Allowance', 850000],
  ['Leasing and marketing', 'Allowance', 1_750_000],
  ['Owner contingency', '3.0% of hard cost', hardCostBase * 0.03],
];
const hardSoftBeforeFinancing = hardCostBase + softCostRows.reduce((s, r) => s + r[2], 0);
const developerFee = hardSoftBeforeFinancing * 0.03;
const loanToCost = 0.65;
const interestRate = 0.0875;
const constructionMonths = 27;
const loanBeforeInterest = (hardSoftBeforeFinancing + developerFee) * loanToCost;
const avgDraw = 0.55;
const interestReserve = loanBeforeInterest * interestRate * (constructionMonths / 12) * avgDraw;
const loanOrigination = loanBeforeInterest * 0.0125;
const tdc = hardSoftBeforeFinancing + developerFee + interestReserve + loanOrigination;
const loan = tdc * loanToCost;
const equity = tdc - loan;

const noiPotentialRent = program.baseUnits * 2590 * 12;
const resVacancy = noiPotentialRent * 0.06;
const commercialRent = program.commercialBase * 28 * 0.90;
const egi = noiPotentialRent - resVacancy + commercialRent;
const opex = egi * 0.38;
const noi = egi - opex;
const permRate = 0.07;
const dscr = 1.25;
const mortgageConstant = 0.0798;
const supportableDebt = noi / dscr / mortgageConstant;

const summary = [
  ['Listed unit schedule total', listedUnitCount.toLocaleString('en-US')],
  ['Corrected base units modeled', program.baseUnits.toLocaleString('en-US')],
  ['Blended residential NSF/unit from listed mix', blendedNsf.toFixed(1)],
  ['Residential NSF modeled', Math.round(residentialNsf).toLocaleString('en-US')],
  ['Residential GSF modeled at 80.5% efficiency', Math.round(residentialGsf).toLocaleString('en-US')],
  ['Commercial GSF base case', program.commercialBase.toLocaleString('en-US')],
  ['Structured parking GSF base case', garageGsf.toLocaleString('en-US')],
  ['Total constructed GSF excl. surface sitework', Math.round(totalGsfBase).toLocaleString('en-US')],
  ['Adjusted direct hard cost incl. Div 01 general conditions', fmt(adjustedDirect)],
  ['GC O&P at 10%', fmt(gcOp)],
  ['Contingency at 10%', fmt(contingency)],
  ['Base hard cost', fmt(hardCostBase)],
  ['Low hard cost range', fmt(hardLow)],
  ['High hard cost range', fmt(hardHigh)],
  ['Hard cost per unit', fmt(hardCostBase / program.baseUnits)],
  ['Hard cost per residential GSF', fmt(hardCostBase / residentialGsf)],
  ['Hard cost per total constructed GSF', fmt(hardCostBase / totalGsfBase)],
  ['Structured garage cost per stall hard-cost equivalent', fmt((garageGsf * 151) / program.garageStallsBase)],
  ['Total development cost', fmt(tdc)],
  ['Required equity at 65% LTC', fmt(equity)],
  ['Construction loan sizing at 65% LTC', fmt(loan)],
  ['Interest reserve', fmt(interestReserve)],
  ['Supportable permanent debt from stated rent assumptions', fmt(supportableDebt)],
  ['Likely financing gap vs construction loan', fmt(Math.max(0, loan - supportableDebt))],
];

const costCsvRows = [
  ['Section', 'CSI Division', 'Description', '2023 Catalogue Basis', '2026 Escalation Factor', 'Location Factor', 'Quantity Basis', 'Quantity', '2023 Unit Cost', '2026 Unit Cost', 'Extended Cost', 'Confidence', 'Notes'],
  ...divRows.map((r) => ['CSI Detail', r.code, r.name, r.basis, r.escalation.toFixed(3), locationFactor.toFixed(3), r.qtyBasis, r.qty.toFixed(2), r.unitCost2023.toFixed(2), r.unitCost2026.toFixed(2), money(r.ext), r.confidence, r.notes]),
  ['Summary', '', 'Adjusted direct plus general conditions', '', '', '', '', '', '', '', money(adjustedDirect), '', ''],
  ['Summary', '', 'GC overhead and profit base case', '', '', '', '10%', '', '', '', money(gcOp), '', 'Sensitivity: 8%, 12%, 15% shown in markdown.'],
  ['Summary', '', 'Base contingency', '', '', '', '10%', '', '', '', money(contingency), '', 'Conceptual 15%, DD 10%, GMP/bid 5%.'],
  ['Summary', '', 'Base hard cost', '', '', '', '', '', '', '', money(hardCostBase), '', ''],
];
await fs.writeFile(path.join(outDir, 'argona_hills_cost_model.csv'), csv(costCsvRows));

const sourcesUsesRows = [
  ['Category', 'Line Item', 'Basis', 'Amount'],
  ['Sources', 'Construction loan', '65% LTC', money(loan)],
  ['Sources', 'Required equity', 'TDC less loan', money(equity)],
  ['Uses', 'Hard cost', 'Base hard cost incl. general conditions, GC O&P and contingency', money(hardCostBase)],
  ...softCostRows.map((r) => ['Uses', r[0], r[1], money(r[2])]),
  ['Uses', 'Developer fee', '3% of TDC before financing', money(developerFee)],
  ['Uses', 'Interest reserve', 'Average drawn balance method', money(interestReserve)],
  ['Uses', 'Construction loan origination', '1.25% of pre-interest loan basis', money(loanOrigination)],
  ['Uses', 'Total development cost', 'All uses', money(tdc)],
];
await fs.writeFile(path.join(outDir, 'argona_hills_sources_uses.csv'), csv(sourcesUsesRows));

const mdTable = (headers, rows) => [
  `| ${headers.join(' | ')} |`,
  `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map((r) => `| ${r.join(' | ')} |`),
].join('\n');

const hardSummary = mdTable(
  ['Item', 'Base Case'],
  summary
);
const csiTable = mdTable(
  ['CSI', 'Division', 'Qty Basis', '2023 Unit', 'Esc.', '2026 Unit', 'Extended', 'Conf.'],
  divRows.map((r) => [r.code, r.name, r.qtyBasis, r.code === '01' ? '8.0%' : fmt(r.unitCost2023), r.escalation.toFixed(3), r.code === '01' ? '8.0%' : fmt(r.unitCost2026), fmt(r.ext), r.confidence])
);
const opSensitivityRows = [0.08, 0.10, 0.12, 0.15].map((op) => {
  const opCost = adjustedDirect * op;
  const cont = (adjustedDirect + opCost) * contingencyBase;
  return [`${(op * 100).toFixed(0)}%`, fmt(opCost), fmt(adjustedDirect + opCost + cont)];
});
const garageRows = [350, 400, 450].map((stalls) => {
  const gsf = stalls * program.garageStallGsf;
  const hard = gsf * 151;
  return [stalls, gsf.toLocaleString('en-US'), fmt(hard / stalls), fmt(hard)];
});
const scenarioRows = [160, 250, 350, 450].map((units) => {
  const nsf = blendedNsf * units;
  const rgsf = nsf / program.residentialEfficiency;
  const comm = units === 450 ? program.commercialBase : Math.round(program.commercialBase * units / 450);
  const garageStalls = units === 450 ? 400 : Math.round(units * 0.9);
  const totalGsf = rgsf + comm + garageStalls * program.garageStallGsf;
  const ratio = totalGsf / totalGsfBase;
  const hard = hardCostBase * ratio * (1.08 - 0.08 * ratio);
  return [`Scenario ${String.fromCharCode(64 + [160,250,350,450].indexOf(units)+1)}`, units, Math.round(rgsf).toLocaleString('en-US'), comm.toLocaleString('en-US'), garageStalls, fmt(hard), fmt(hard / units)];
});
const siteDirect = divRows.filter((r) => ['02','31','32','33'].includes(r.code)).reduce((s, r) => s + r.ext, 0);
const siteRangeRows = [
  ['Low', fmt(siteDirect * 0.75), fmt(siteDirect * 0.75 * 1.10 * 1.10)],
  ['Base', fmt(siteDirect), fmt(siteDirect * 1.10 * 1.10)],
  ['High', fmt(siteDirect * 1.45), fmt(siteDirect * 1.45 * 1.10 * 1.15)],
];
const commercialSensitivityRows = [
  ['99,000 SF', totalGsfBase.toLocaleString('en-US'), fmt(hardCostBase), fmt(tdc)],
  ['150,000 SF', Math.round(totalGsfBase + 51_000).toLocaleString('en-US'), fmt(hardCostBase + 51_000 * 335), fmt(tdc + 51_000 * 435)],
];

const modelMd = `# Argona Hills / Gunpowder Plaza Lender-Grade Hard Cost Model

## Bottom Line

The prior $85M-$90M total development cost is not defensible for the corrected 450-unit mixed-use program. A lender-facing conceptual base case is approximately **${fmt(tdc)} TDC**, with **${fmt(hardCostBase)}** of hard cost and a plausible hard-cost range of **${fmt(hardLow)} to ${fmt(hardHigh)}** before drawings and GC pricing.

The listed unit mix is internally inconsistent: 92 one-bedrooms + 194 two-bedrooms + 84 three-bedrooms equals **370 units**, not 450. I modeled the 450-unit base case by preserving that mix's blended average of **${blendedNsf.toFixed(1)} NSF/unit**, producing **${Math.round(residentialNsf).toLocaleString('en-US')} residential NSF** and **${Math.round(residentialGsf).toLocaleString('en-US')} residential GSF** at 80.5% efficiency.

## Catalog Basis

${catalogSources.map((s) => `- ${s}`).join('\n')}

Because no architectural, structural, civil, MEP, geotech, utility, or GC bid documents were provided, this is a conceptual underwriting model calibrated to the June 2023 Maryland DGS CTC rather than a task-by-task quantity takeoff.

## Hard Cost Summary

${hardSummary}

## Detailed CSI Estimate

${csiTable}

## GC O&P Sensitivity

${mdTable(['GC O&P', 'O&P Dollars', 'Hard Cost After O&P + 10% Contingency'], opSensitivityRows)}

## Parking Garage Model

Assumption: structured garage at 365 GSF/stall, conceptual 2026 hard cost equivalent of about $151/GSF including concrete structure, striping, lighting, drainage, elevators/stairs allowance, EV rough-ins, security, fire protection and ventilation allowance.

${mdTable(['Stalls', 'Garage GSF', 'Cost/Stall', 'Hard Cost'], garageRows)}

## Sitework Model

Base horizontal/sitework included in Divisions 02, 31, 32 and 33 totals approximately **${fmt(siteDirect)}** before GC O&P and contingency. It covers clearing, grading, erosion control, internal roads, surface parking, curb/gutter, sidewalks, streetlights, landscaping, dry utilities, water/sewer coordination and stormwater.

${mdTable(['Site Case', 'Adjusted Direct', 'Hard Cost With Markups'], siteRangeRows)}

## Scenario Comparison

${mdTable(['Scenario', 'Units', 'Residential GSF', 'Commercial GSF', 'Garage Stalls', 'Hard Cost', 'Hard/Unit'], scenarioRows)}

## Commercial Area Sensitivity

The 150,000 SF case adds 51,000 GSF. It is carried at a conceptual marginal hard cost of $335/GSF and marginal TDC of $435/GSF, assuming warm-shell delivery.

${mdTable(['Commercial Case', 'Total Constructed GSF', 'Hard Cost', 'TDC'], commercialSensitivityRows)}

## Total Development Cost / Financing

${mdTable(['Metric', 'Base Case'], [
  ['Land', fmt(program.landCost)],
  ['Hard cost', fmt(hardCostBase)],
  ['Soft costs before developer fee and financing', fmt(softCostRows.reduce((s, r) => s + r[2], 0))],
  ['Developer fee', fmt(developerFee)],
  ['Interest reserve', fmt(interestReserve)],
  ['Loan origination', fmt(loanOrigination)],
  ['Total development cost', fmt(tdc)],
  ['Construction loan at 65% LTC', fmt(loan)],
  ['Required equity', fmt(equity)],
  ['Modeled NOI from stated rent assumptions', fmt(noi)],
  ['Supportable permanent debt at 1.25x DSCR and 7.0% / 30-year constant', fmt(supportableDebt)],
  ['Indicative financing gap vs construction loan', fmt(Math.max(0, loan - supportableDebt))],
])}

## Financeability View

At the stated blended residential rent of $2,590/month and a 99,000 SF commercial case, the project does not appear financeable on conventional stabilized permanent debt unless one or more of the following changes materially: rents, commercial rent/absorption, density, land basis, subsidy, tax credits/PILOT, parking design, phasing, or cost. The modeled supportable permanent debt is far below the 65% LTC construction loan, creating an indicative refinancing gap of **${fmt(Math.max(0, loan - supportableDebt))}**.
`;
await fs.writeFile(path.join(outDir, 'argona_hills_lender_grade_hard_cost_model.md'), modelMd);

const riskMd = `# Argona Hills Assumptions And Risks

## Critical Corrections

- The prior 36,000 / 31,000 / 22,000 GSF building assumptions are unrealistic for the stated unit counts. The corrected 450-unit base case requires roughly **${Math.round(residentialGsf).toLocaleString('en-US')} residential GSF** before commercial and parking.
- The stated unit mix totals **370 units**, not 450. The model normalizes the listed mix to 450 units using the same blended NSF.
- A $85M-$90M TDC is not supportable. The base TDC is approximately **${fmt(tdc)}**; hard cost alone is approximately **${fmt(hardCostBase)}**.

## Fit And Program Risks

- 450 units may fit mathematically on 28 acres and on 12 acres of CGO-zoned land at 48 DU/acre, but the real test is building footprint, parking, stormwater, roads, buffers, grades, utility easements, fire access and commercial massing.
- 99,000 SF of commercial space is aggressive for lender underwriting unless there is strong preleasing, a credible tenant mix, and parking/traffic support. 150,000 SF is substantially higher risk.
- 400 structured stalls plus 185 assumed surface stalls gives about 1.30 spaces/unit before commercial demand. That may be tight once retail/commercial parking, accessible stalls, loading, visitors and zoning requirements are included.

## Cost Risks

- Sitework is the largest unknown: geotech, rock, unsuitable soils, retaining walls, stormwater management, off-site utility upgrades and road improvements can move the budget by tens of millions.
- Structured parking is highly sensitive to below-grade scope. Any meaningful below-grade component should be repriced separately.
- MEP scope is unresolved: all-electric strategy, DOAS/VRF/PTAC selection, commercial shell requirements, fire pump/standpipe needs and utility service capacity can materially change Divisions 21-28.
- The CTC is a Job Order Contracting catalog. It is useful for locally priced task calibration, but it is not a substitute for schematic design takeoffs or a GC/subcontractor market bid.

## Assumptions To Verify

- Architect: final unit mix, net-to-gross efficiency, building type, egress/core count, amenity area, facade system, commercial shell/TI split, height and code classification.
- Civil engineer: disturbed acreage, grading, SWM/BMP strategy, road layout, frontage improvements, utility routing, dry utility relocations, fire access and parking counts.
- Structural engineer: foundation system, podium/transfer requirements, garage structural bay, below-grade scope, lateral system and material selection.
- MEP engineer: HVAC basis, electrical service, fire pump/standpipe requirements, plumbing fixture counts, water/sewer capacity and EV charging strategy.
- GC/Estimator: current Prince George County subcontractor pricing, labor availability, escalation to midpoint, logistics, phasing, procurement risk and buyout strategy.
- Lender: acceptable developer fee treatment, contingency, interest reserve sizing, recourse, LTC/LTV constraint, DSCR, preleasing requirements and required third-party reports.

## Required Next Documents

- ALTA/survey, topo, concept civil plan, geotech report, environmental Phase I/II, zoning confirmation, parking study, traffic study, utility will-serve letters, schematic architecture, structural narrative, MEP narrative and preliminary GC estimate.
`;
await fs.writeFile(path.join(outDir, 'argona_hills_assumptions_and_risks.md'), riskMd);

console.log(JSON.stringify({
  files: [
    'outputs/argona_hills_lender_grade_hard_cost_model.md',
    'outputs/argona_hills_cost_model.csv',
    'outputs/argona_hills_sources_uses.csv',
    'outputs/argona_hills_assumptions_and_risks.md',
  ],
  baseHardCost: money(hardCostBase),
  tdc: money(tdc),
  equity: money(equity),
  loan: money(loan),
}, null, 2));
