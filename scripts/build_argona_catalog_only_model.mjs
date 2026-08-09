import fs from 'node:fs/promises';
import path from 'node:path';

const tasks = JSON.parse(await fs.readFile('data/ctc-june-2023-tasks.json', 'utf8'));
const byCode = new Map(tasks.map((task) => [task.code, task]));
// Source PDF page 22 41, Page 1: this row wraps across lines and is not
// captured by the single-line task index.
byCode.set('22 41 13 13-0002', {
  code: '22 41 13 13-0002',
  division: '22',
  uom: 'EA',
  description: '2 Piece Tank Type, Gravity Flush System, Floor Mounted, Floor Outlet, Elongated Vitreous China Water Closet (Kohler Wellworth K-3978)',
  unitCost2023: 410.30,
});
const outputDir = path.resolve('outputs');
await fs.mkdir(outputDir, { recursive: true });

const units = { one: 112, two: 236, three: 102 }; // normalized listed 92/194/84 mix to 450
const unitCount = units.one + units.two + units.three;
const residentialNsf = units.one * 750 + units.two * 980 + units.three * 1200;
const residentialGsf = residentialNsf / 0.805;
const commercialGsf = 99_000;
const buildingGsf = residentialGsf + commercialGsf;
const buildingCount = 5;
const floors = 6;
const footprint = buildingGsf / floors;
const garageStalls = 400;
const garageGsf = garageStalls * 365;
const totalConstructedGsf = buildingGsf + garageGsf;

const escalation = {
  labor: 1.15,
  material: 1.12,
  equipment: 1.125,
  mep: 1.16,
  blended: 1.14,
  professional: 1.15,
};
const locationFactor = 1.0;

const splitByDivision = {
  '01': [0.75, 0.15, 0.10, 58],
  '02': [0.55, 0.15, 0.30, 45],
  '03': [0.40, 0.50, 0.10, 55],
  '04': [0.55, 0.43, 0.02, 62],
  '05': [0.35, 0.60, 0.05, 72],
  '06': [0.50, 0.48, 0.02, 58],
  '07': [0.45, 0.53, 0.02, 61],
  '08': [0.35, 0.63, 0.02, 62],
  '09': [0.60, 0.38, 0.02, 53],
  '10': [0.45, 0.53, 0.02, 55],
  '11': [0.15, 0.83, 0.02, 55],
  '12': [0.35, 0.63, 0.02, 55],
  '13': [0.40, 0.55, 0.05, 58],
  '14': [0.25, 0.70, 0.05, 65],
  '21': [0.55, 0.43, 0.02, 78],
  '22': [0.55, 0.43, 0.02, 81],
  '23': [0.45, 0.50, 0.05, 81],
  '26': [0.55, 0.43, 0.02, 78],
  '27': [0.55, 0.43, 0.02, 70],
  '28': [0.45, 0.53, 0.02, 70],
  '31': [0.35, 0.20, 0.45, 50],
  '32': [0.45, 0.45, 0.10, 50],
  '33': [0.45, 0.45, 0.10, 55],
};

const rows = [];
const estimateDivisionByName = {
  'General Requirements': '01',
  'Existing Conditions / Demo': '02',
  'Concrete': '03',
  'Masonry': '04',
  'Metals': '05',
  'Wood, Plastics, Composites': '06',
  'Thermal and Moisture Protection': '07',
  'Openings': '08',
  'Finishes': '09',
  'Specialties': '10',
  'Equipment': '11',
  'Furnishings': '12',
  'Special Construction': '13',
  'Conveying Equipment / Elevators': '14',
  'Fire Suppression': '21',
  'Plumbing': '22',
  'HVAC': '23',
  'Electrical': '26',
  'Low Voltage / Communications': '27',
  'Electronic Safety and Security': '28',
  'Earthwork': '31',
  'Exterior Improvements': '32',
  'Utilities': '33',
};
function add(code, quantity, quantityBasis, divisionName, note = '', escalationFactor = escalation.blended) {
  const task = byCode.get(code);
  if (!task) throw new Error(`CTC task not found: ${code}`);
  const [laborShare, materialShare, equipmentShare, wage] = splitByDivision[task.division] || [0.45, 0.50, 0.05, 58];
  const direct2023 = task.unitCost2023 * quantity;
  const labor2023 = direct2023 * laborShare;
  const material2023 = direct2023 * materialShare;
  const equipment2023 = direct2023 * equipmentShare;
  const factor = escalationFactor * locationFactor;
  rows.push({
    type: 'Hard Cost',
    division: estimateDivisionByName[divisionName],
    sourceDivision: task.division,
    divisionName,
    code,
    description: task.description,
    uom: task.uom,
    quantity,
    quantityBasis,
    unitCost2023: task.unitCost2023,
    direct2023,
    escalationFactor,
    locationFactor,
    unitCost2026: task.unitCost2023 * factor,
    extension2026: direct2023 * factor,
    laborHours: labor2023 / wage,
    labor2026: labor2023 * escalation.labor,
    material2026: material2023 * escalation.material,
    equipment2026: equipment2023 * escalation.equipment,
    note: `${note} Labor/material/equipment and man-hours are derived allocations; the distributed CTC publishes only total direct unit cost.`,
  });
}

// Division 01
add('01 71 23 16-0016', 28, '28-acre site', 'General Requirements', 'Underground utility survey.');
add('01 74 19 00-0016', 180, 'One 40 CY pull per building per month for 30 months, reduced for overlap', 'General Requirements', 'Construction dumpsters.');
// Division 02
add('02 90 20 00-0003', 20, '20 disturbed acres assumed', 'Existing Conditions / Demo', 'Clear light brush/vegetation.');
// Division 03
add('03 31 13 00-0005', footprint + garageGsf, '6-inch slab-on-grade at building footprints and garage area', 'Concrete');
add('03 31 13 00-0050', garageGsf * 3 * 0.5 / 27, 'Three 6-inch elevated garage decks; square feet converted to cubic yards', 'Concrete');
add('03 21 11 00-0255', (garageGsf * 3 * 7.5) / 2000, '7.5 lb/SF reinforcing allowance converted from pounds to tons', 'Concrete');
// Division 04
add('04 22 23 13-0006', buildingCount * floors * 2500, '2,500 SF 8-inch lightweight CMU/core walls per floor per building', 'Masonry');
// Division 05
add('05 36 00 00-0042', garageGsf * 3, '18-gauge composite deck at three garage elevated levels', 'Metals');
add('05 21 19 00-0002', (garageGsf * 3 * 8) / 2000, '8 lb/SF steel joist allowance', 'Metals');
// Division 06
add('06 11 16 00-0050', residentialGsf * 0.95 * 0.75, 'Interior/exterior 2x6 stud length derived from residential floor area', 'Wood, Plastics, Composites');
add('06 11 16 00-0015', residentialGsf * 0.75, '2x10 floor joists at conceptual 16-inch spacing', 'Wood, Plastics, Composites');
add('06 16 43 00-0003', buildingCount * 950 * 70, 'Conceptual exterior wall area: five buildings, 950 LF perimeter, 70 FT average facade height', 'Wood, Plastics, Composites');
// Division 07
add('07 21 16 00-0006', buildingCount * 950 * 70, 'R-21 facade insulation area', 'Thermal and Moisture Protection');
add('07 46 46 00-0004', buildingCount * 950 * 70 * 0.65, '65% fiber-cement facade assumption', 'Thermal and Moisture Protection');
add('07 54 23 00-0004', footprint / 100, '60 mil fully adhered TPO; CTC UOM is roofing square', 'Thermal and Moisture Protection');
// Division 08
add('08 53 13 00-0071', units.one * 4 + units.two * 6 + units.three * 8, 'Four/six/eight 36x60 windows by unit type', 'Openings');
add('08 42 13 00-0002', buildingCount * 4 + 12, 'Four building entrances each plus commercial entrances', 'Openings');
add('08 12 13 13-0008', unitCount + buildingCount * floors * 12, 'Unit entries plus rated common/core frames', 'Openings');
// Division 09
add('09 29 10 00-0009', residentialGsf * 3.2, '3.2 SF of Type X gypsum board per residential GSF', 'Finishes');
add('09 29 10 00-0038', residentialGsf * 3.2, 'Tape/spackle/finish matching gypsum board area', 'Finishes');
add('01 95 09 00-0003', residentialGsf, 'Complete residential unit painting per residential GSF', 'Finishes');
add('09 65 23 00-0002', residentialNsf * 0.72, 'Vinyl plank at 72% of residential NSF', 'Finishes');
add('09 30 13 00-0015', residentialNsf * 0.10, 'Residential ceramic tile at 10% of NSF', 'Finishes');
add('09 68 13 00-0004', residentialNsf * 0.18 / 9, '20-ounce carpet tile at 18% of NSF; CTC UOM SY', 'Finishes');
// Division 10
add('10 28 16 13-0083', unitCount + units.three, 'One two-roll toilet tissue dispenser per bathroom', 'Specialties');
add('10 28 16 13-0039', unitCount + units.three, 'One 24-inch towel bar per bathroom', 'Specialties');
add('10 28 16 13-0026', unitCount + units.three, 'One shower curtain rod per bathroom', 'Specialties');
// Division 11
add('11 30 13 13-0050', unitCount, 'One 20-22 CF refrigerator per unit', 'Equipment');
add('11 30 13 13-0005', unitCount, 'One 30-inch electric range per unit', 'Equipment');
add('11 30 13 13-0082', unitCount, 'One 24-inch dishwasher per unit', 'Equipment');
// Division 12
add('12 36 23 13-0003', unitCount * 24, '24 SF plastic laminate countertop per unit', 'Furnishings');
add('12 36 23 13-0005', unitCount * 1.5, 'Sink/faucet cutouts', 'Furnishings');
// Division 13
add('13 34 19 00-0164', buildingCount * 200, 'One 10 FT x 20 FT prefinished aluminum wall-hung entrance canopy per residential building', 'Special Construction');
// Division 14
add('14 21 23 13-0004', 10, 'Two 3,000-lb, six-stop traction elevators per building', 'Conveying Equipment / Elevators');
// Division 21
add('21 13 13 00-0004', buildingGsf / 180, 'One concealed light-hazard sprinkler head per 180 SF', 'Fire Suppression', '', escalation.mep);
add('21 13 13 00-0006', garageGsf / 155, 'One exposed ordinary-hazard sprinkler head per 155 SF', 'Fire Suppression', '', escalation.mep);
// Division 22
add('22 41 13 13-0002', unitCount + units.three, 'One floor-mounted elongated tank-type water closet per unit plus second toilet in 3BR units', 'Plumbing', '', escalation.mep);
add('22 42 19 00-0013', unitCount + units.three, 'One tub per unit plus second bath in 3BR units', 'Plumbing', '', escalation.mep);
add('22 41 16 16-0002', unitCount, 'One kitchen sink per unit', 'Plumbing', '', escalation.mep);
add('22 41 39 00-0003', unitCount, 'One kitchen faucet with spray per unit', 'Plumbing', '', escalation.mep);
add('22 41 39 00-0012', unitCount + units.three, 'Lavatory faucet count follows bathroom count', 'Plumbing', '', escalation.mep);
add('01 95 22 00-0006', unitCount + units.three, '30.5-inch vanity count follows bathroom count', 'Plumbing', '', escalation.mep);
add('22 33 30 16-0004', unitCount, 'One 50-gallon electric water heater per unit', 'Plumbing', '', escalation.mep);
// Division 23
add('23 81 13 11-0010', units.one, 'One 11,800 BTU packaged terminal heat pump per 1BR', 'HVAC', '', escalation.mep);
add('23 81 49 00-0028', units.two, 'One 17,500 BTU ductless heat pump per 2BR', 'HVAC', '', escalation.mep);
add('23 81 49 00-0029', units.three, 'One 24,200 BTU ductless heat pump per 3BR', 'HVAC', '', escalation.mep);
add('01 95 23 00-0009', unitCount * 2, 'Two residential exhaust fans per unit', 'HVAC', '', escalation.mep);
// Division 26
add('26 24 16 00-0489', unitCount, 'One up-to-42-circuit panelboard with breakers per unit; CTC row is removal/reinstallation because no complete new-install residential load-center row is published', 'Electrical', '', escalation.mep);
add('01 95 26 00-0002', residentialGsf * 3.0, 'Three LF of 12 AWG cable per residential GSF', 'Electrical', '', escalation.mep);
add('01 95 26 00-0007', unitCount * 8, 'Eight residential ceiling fixtures per unit', 'Electrical', '', escalation.mep);
// Division 27
add('27 15 13 00-0480', buildingGsf * 1.2 / 1000, '1.2 LF Cat 6 cable per building GSF; CTC UOM MLF', 'Low Voltage / Communications', '', escalation.mep);
// Division 28
add('28 46 13 31-0976', buildingCount, 'One intelligent fire alarm CPU per building', 'Electronic Safety and Security', '', escalation.mep);
add('01 95 26 00-0029', unitCount * 2, 'Two combined CO/fire alarms per unit', 'Electronic Safety and Security', '', escalation.mep);
// Division 31
add('31 24 13 00-0017', 20 * 43560 / 9, 'Rough grading for 20 disturbed acres; CTC UOM SY', 'Earthwork');
add('31 23 16 33-0003', 150_000, 'Conceptual bulk excavation in soil by hydraulic excavator/front-end loader/backhoe', 'Earthwork');
// Division 32
add('32 11 16 16-0007', 300_000 / 9, 'Six-inch aggregate base under 300,000 SF roads/surface lots; CTC UOM SY', 'Exterior Improvements');
add('32 12 16 13-0005', 300_000 / 9, 'Three-inch asphalt paving over roads/surface lots; CTC UOM SY', 'Exterior Improvements');
add('32 16 23 00-0002', 80_000, 'Four-inch concrete sidewalks', 'Exterior Improvements');
add('32 16 13 13-0016', 12_000, 'Curb and gutter', 'Exterior Improvements');
add('26 56 13 00-0192', 45, 'Twenty-foot site light poles', 'Exterior Improvements', '', escalation.mep);
add('26 56 19 00-0238', 45, 'LED area fixtures', 'Exterior Improvements', '', escalation.mep);
// Division 33
add('33 14 13 39-0028', 4_500, 'Eight-inch Type K copper water distribution', 'Utilities', '', escalation.mep);
add('33 31 11 00-0024', 4_500, 'Eight-inch Schedule 40 PVC sanitary sewer', 'Utilities', '', escalation.mep);
add('33 42 11 00-0007', 6_500, 'Twenty-four-inch Class 3 RCP storm drainage', 'Utilities', '', escalation.mep);
add('33 42 31 00-0056', 32, 'Six-foot-deep 4x4 catch basins', 'Utilities', '', escalation.mep);
add('33 14 19 00-0331', 8, 'Six-foot burial modern three-way fire hydrants', 'Utilities', '', escalation.mep);

const hardTotal = rows.reduce((sum, row) => sum + row.extension2026, 0);
const laborHours = rows.reduce((sum, row) => sum + row.laborHours, 0);
const laborTotal = rows.reduce((sum, row) => sum + row.labor2026, 0);
const materialTotal = rows.reduce((sum, row) => sum + row.material2026, 0);
const equipmentTotal = rows.reduce((sum, row) => sum + row.equipment2026, 0);

const soft = [];
function addSoft(code, hours, basis, category) {
  const task = byCode.get(code);
  if (!task) throw new Error(`CTC soft task not found: ${code}`);
  soft.push({
    category,
    code,
    description: task.description,
    uom: task.uom,
    quantity: hours,
    basis,
    unitCost2023: task.unitCost2023,
    escalationFactor: escalation.professional,
    extension2026: task.unitCost2023 * hours * escalation.professional,
  });
}
addSoft('01 22 20 00-0050', buildingCount * 120, '120 principal architect hours/building', 'Architecture');
addSoft('01 22 20 00-0051', buildingCount * 700, '700 senior architect hours/building', 'Architecture');
addSoft('01 22 20 00-0052', buildingCount * 1800, '1,800 architect hours/building', 'Architecture');
addSoft('01 22 20 00-0053', buildingCount * 140, '140 principal engineering hours/building', 'Engineering');
addSoft('01 22 20 00-0054', buildingCount * 850, '850 senior engineering hours/building', 'Engineering');
addSoft('01 22 20 00-0055', buildingCount * 2200, '2,200 engineering hours/building', 'Engineering');
addSoft('01 22 20 00-0046', 30 * 160, 'One full-time testing technician equivalent for 30 months', 'Testing');
addSoft('01 22 20 00-0043', 320, 'Senior surveyor hours', 'Survey');
addSoft('01 22 20 00-0044', 640, 'Instrument-person hours', 'Survey');
addSoft('01 22 20 00-0045', 640, 'Rod-person hours', 'Survey');
const softTotal = soft.reduce((sum, row) => sum + row.extension2026, 0);

// Complete-project underwriting assumptions supplied in the project brief.
// The contractor adjustment factor is the only markup for GC overhead/profit,
// supervision, insurance/bonding, and subcontractor O&P.
const contractorAdjustmentFactor = 1.10;
const adjustedHardCost = hardTotal * contractorAdjustmentFactor;
const contingencyRate = 0.10;
const contingency = adjustedHardCost * contingencyRate;
const totalHardCost = adjustedHardCost + contingency;
const landCost = 7_100_000;

const allowanceRows = [
  ['Environmental Phase I/II and geotechnical', 'Project allowance; excludes services already included in CTC engineering/testing rows.', 650_000],
  ['Legal, zoning and entitlement', 'Project allowance for rezoning, land-use counsel and closing support.', 1_000_000],
  ['Permits and impact fees', 'Conservative project allowance pending agency fee schedules and actual receipts.', 2_500_000],
  ['Utility connection and meter fees', 'Connection/administrative fees only; physical utility construction is in CSI 33.', 1_250_000],
  ['Taxes during construction', 'Allowance; builder risk, contractor insurance and bonding remain in the adjustment factor.', 600_000],
  ['Appraisal, lender reports and lender legal', 'Combined third-party allowance.', 550_000],
  ['Leasing and marketing', 'Initial residential and commercial lease-up allowance.', 1_500_000],
  ['Owner legal/accounting/administration', 'Owner-side project administration allowance.', 500_000],
];
const otherSoftAllowances = allowanceRows.reduce((sum, row) => sum + row[2], 0);
const softBeforeDeveloperFee = softTotal + otherSoftAllowances;
const developerFeeRate = 0.03;
const developerFee = (totalHardCost + softBeforeDeveloperFee) * developerFeeRate;
const preFinancingCost = landCost + totalHardCost + softBeforeDeveloperFee + developerFee;

const loanToCost = 0.65;
const constructionRate = 0.0875;
const constructionMonths = 27;
const averageDrawFactor = 0.55;
const originationRate = 0.0125;
const preliminaryLoan = preFinancingCost * loanToCost;
const interestReserve = preliminaryLoan * constructionRate * (constructionMonths / 12) * averageDrawFactor;
const loanOriginationFee = preliminaryLoan * originationRate;
const totalDevelopmentCost = preFinancingCost + interestReserve + loanOriginationFee;
const constructionLoan = totalDevelopmentCost * loanToCost;
const requiredEquity = totalDevelopmentCost - constructionLoan;

const financingRows = [
  ['Construction loan interest reserve', `${(constructionRate * 100).toFixed(2)}% annual rate, ${constructionMonths} months, ${(averageDrawFactor * 100).toFixed(0)}% average drawn balance`, interestReserve],
  ['Construction loan origination fee', `${(originationRate * 100).toFixed(2)}% of preliminary loan basis`, loanOriginationFee],
];
const totalPriced = totalDevelopmentCost;

const fmt = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const num = (n, decimals = 2) => Number(n).toFixed(decimals);
const quote = (value) => {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (matrix) => matrix.map((row) => row.map(quote).join(',')).join('\n') + '\n';

await fs.writeFile(path.join(outputDir, 'argona_hills_cost_model.csv'), toCsv([
  ['Cost Type','Estimate CSI Division','Source CTC Division','Division Name','CTC Task Code','CTC Description','UOM','Quantity','Quantity Basis','2023 CTC Unit Cost','2023 Direct Cost','2026 Escalation','Location Factor','2026 Unit Cost','2026 Extended Cost','Derived Labor Hours','Derived 2026 Labor','Derived 2026 Material','Derived 2026 Equipment','Notes'],
  ...rows.map((r) => [r.type,r.division,r.sourceDivision,r.divisionName,r.code,r.description,r.uom,num(r.quantity),r.quantityBasis,num(r.unitCost2023),num(r.direct2023),num(r.escalationFactor,3),num(r.locationFactor,3),num(r.unitCost2026),num(r.extension2026),num(r.laborHours),num(r.labor2026),num(r.material2026),num(r.equipment2026),r.note]),
  ...soft.map((r) => ['Soft Cost','01','01',r.category,r.code,r.description,r.uom,num(r.quantity),r.basis,num(r.unitCost2023),num(r.unitCost2023*r.quantity),num(r.escalationFactor,3),'1.000',num(r.unitCost2023*r.escalationFactor),num(r.extension2026),'','','','', 'Exact CTC professional-service rate; hours are project assumptions.']),
  ['Contractor Adjustment','','','','','All-in contractor adjustment factor','LS',1,'Includes GC overhead/profit, supervision, insurance/bonding and subcontractor O&P once only',0,0,'','','',num(adjustedHardCost-hardTotal),'','','','',`Factor ${(contractorAdjustmentFactor).toFixed(3)}`],
  ['Contingency','','','','','Design development contingency','LS',1,`${(contingencyRate*100).toFixed(0)}% of adjusted hard cost`,0,0,'','','',num(contingency),'','','','',''],
  ...allowanceRows.map((r) => ['Allowance','','','','',r[0],'LS',1,r[1],0,0,'','','',num(r[2]),'','','','',r[1]]),
  ['Developer Fee','','','','','Developer fee','LS',1,`${(developerFeeRate*100).toFixed(0)}% of hard and soft costs before land/financing`,0,0,'','','',num(developerFee),'','','','',''],
  ...financingRows.map((r) => ['Financing','','','', '',r[0],'LS',1,r[1],0,0,'','','',num(r[2]),'','','','',r[1]]),
]));

const divisionTotals = [...new Set(rows.map((r) => r.division))].sort().map((division) => {
  const divisionRows = rows.filter((r) => r.division === division);
  return [division, divisionRows[0].divisionName, divisionRows.reduce((s, r) => s + r.extension2026, 0)];
});

await fs.writeFile(path.join(outputDir, 'argona_hills_sources_uses.csv'), toCsv([
  ['Category','Line Item','CTC Basis','Amount'],
  ['Hard Cost Detail','Catalog-priced hard cost','Sum of exact CTC task-code extensions',num(hardTotal)],
  ['Hard Cost Detail','Contractor adjustment factor','1.10 all-in; no separate GC O&P, supervision, insurance/bonding or subcontractor O&P',num(adjustedHardCost-hardTotal)],
  ['Hard Cost Detail','Contingency','10% of adjusted hard cost',num(contingency)],
  ['Uses','Total hard cost','CTC direct cost plus adjustment factor and contingency',num(totalHardCost)],
  ['Uses','Land','Provided acquisition basis',num(landCost)],
  ['Uses','Catalog-priced professional services','Exact CTC professional-service task-code extensions',num(softTotal)],
  ...allowanceRows.map((r) => ['Uses',r[0],r[1],num(r[2])]),
  ['Uses','Developer fee',`${(developerFeeRate*100).toFixed(0)}% of hard and soft costs before land/financing`,num(developerFee)],
  ...financingRows.map((r) => ['Uses',r[0],r[1],num(r[2])]),
  ['Uses','Total development cost','Complete project base case',num(totalDevelopmentCost)],
  ['Sources','Construction loan',`${(loanToCost*100).toFixed(0)}% LTC`,num(constructionLoan)],
  ['Sources','Required equity',`${((1-loanToCost)*100).toFixed(0)}% of TDC`,num(requiredEquity)],
]));

const table = (headers, body) => `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${body.map((r) => `| ${r.join(' | ')} |`).join('\n')}`;
const modelMd = `# Argona Hills Catalog-Only Cost Model

## Test Result

This regeneration discards the previous parametric hard-cost, soft-cost, financing and allowance figures. The priced result uses only exact June 2023 Maryland DGS Central CTC task rows, explicit program quantities and 2026 escalation.

**Catalog-priced 2026 direct hard cost:** ${fmt(hardTotal)}

**Total hard cost with one all-in contractor factor and contingency:** ${fmt(totalHardCost)}

**Total hard cost per residential unit:** ${fmt(totalHardCost / unitCount)}

**Total hard cost per constructed GSF:** ${fmt(totalHardCost / totalConstructedGsf)}

**Total development cost:** ${fmt(totalDevelopmentCost)}

**Construction loan at 65% LTC:** ${fmt(constructionLoan)}

**Required equity:** ${fmt(requiredEquity)}

The CTC remains the direct construction and professional-service pricing source. Project-specific costs that the CTC cannot price are separately identified underwriting assumptions.

## Program Assumptions

${table(['Assumption','Value'],[
  ['Buildings',buildingCount],
  ['Stories per building',floors],
  ['Units',unitCount],
  ['1BR / 2BR / 3BR',`${units.one} / ${units.two} / ${units.three}`],
  ['Residential NSF',Math.round(residentialNsf).toLocaleString('en-US')],
  ['Residential GSF at 80.5% efficiency',Math.round(residentialGsf).toLocaleString('en-US')],
  ['Commercial GSF',commercialGsf.toLocaleString('en-US')],
  ['Structured garage',`${garageStalls} stalls / ${garageGsf.toLocaleString('en-US')} GSF`],
  ['Total constructed GSF',Math.round(totalConstructedGsf).toLocaleString('en-US')],
])}

## Pricing Rules

- Location factor is 1.000 because the source is already Maryland DGS Central.
- 2026 factors: 1.140 blended construction, 1.160 MEP, and 1.150 professional services.
- No web pricing or generic market cost-per-SF inputs are used.
- The companion "Using The Construction Task Catalog" states that unit prices are complete in-place direct labor, material and equipment.
- The distributed PDF provides total direct unit cost, not separate labor/material/equipment or crew-hour columns. Those columns in the CSV are derived allocations and are not represented as CTC source data.
- A single 1.10 contractor adjustment factor includes GC overhead/profit, supervision, insurance/bonding and subcontractor O&P. None of those costs are added elsewhere.

## Division Totals

${table(['CSI','Division','2026 CTC Extended Cost'],divisionTotals.map((r)=>[r[0],r[1],fmt(r[2])]))}

## Labor And Cost Components

${table(['Metric','Derived Result'],[
  ['Total construction man-hours',Math.round(laborHours).toLocaleString('en-US')],
  ['2026 labor component',fmt(laborTotal)],
  ['2026 material component',fmt(materialTotal)],
  ['2026 equipment component',fmt(equipmentTotal)],
  ['Reconciled component total',fmt(laborTotal+materialTotal+equipmentTotal)],
])}

The component total differs slightly from task extensions because trade-class escalation factors are applied to total task prices, while labor/material/equipment components use separate escalation rates for analytical reporting.

## Complete Project Uses

${table(['Use','Amount'],[
  ['Land',fmt(landCost)],
  ['CTC direct hard cost',fmt(hardTotal)],
  ['All-in contractor adjustment',fmt(adjustedHardCost-hardTotal)],
  ['Contingency',fmt(contingency)],
  ['Catalog-priced professional services',fmt(softTotal)],
  ...allowanceRows.map((r)=>[r[0],fmt(r[2])]),
  ['Developer fee',fmt(developerFee)],
  ['Interest reserve',fmt(interestReserve)],
  ['Loan origination fee',fmt(loanOriginationFee)],
  ['Total development cost',fmt(totalDevelopmentCost)],
])}
`;
await fs.writeFile(path.join(outputDir, 'argona_hills_lender_grade_hard_cost_model.md'), modelMd);

const risksMd = `# Argona Hills Catalog-Only Assumptions And Risks

## Exactness Boundary

Every priced row in the cost CSV contains an exact CTC task code and June 2023 direct unit price. Exact extended cost still depends on assumed quantities. Without drawings, the model cannot be an exact construction takeoff even though its unit prices are exact catalog values.

## Quantity Assumptions Requiring Verification

- Five residential/mixed-use buildings, six stories each.
- Listed unit mix normalized proportionally from 370 to 450 units: 112 one-bedroom, 236 two-bedroom and 102 three-bedroom.
- Residential efficiency of 80.5%, 99,000 commercial GSF, and 400 structured stalls at 365 GSF/stall.
- Structural framing, facade area, wall factors, utility lengths, grading quantities and site paving quantities are conceptual.
- Apartment fixture counts, windows, appliances, HVAC units and electrical/low-voltage quantities are formula-based by unit type.

## Catalog Limitations

- The PDF's visible pricing column is Total Direct Unit Cost. Labor, materials, equipment and man-hours are not separately printed.
- The "Using" guide places overhead, profit, insurance/bonding, project supervision and subcontractor O&P in the contractor adjustment factor. The complete-project model uses one conservative 1.10 factor and does not add these costs elsewhere.
- Financing, contingency, impact fees and utility connection fees are separately labeled underwriting assumptions because the CTC does not publish project-specific values.
- Task selection does not replace architect, engineer, civil and GC quantity takeoffs.

## Required Platform Inputs For Bid-Level Accuracy

- Building count, footprint and floor-by-floor area.
- Wall type schedules, structural system and member quantities.
- Door/window schedules and room finish schedules.
- Plumbing fixture, HVAC equipment, electrical device and fire-protection schedules.
- Civil grading, paving, stormwater and wet/dry utility plans.
- Contractor adjustment factor and agency receipts/fee schedules.
`;
await fs.writeFile(path.join(outputDir, 'argona_hills_assumptions_and_risks.md'), risksMd);

console.log(JSON.stringify({
  hardTotal: Math.round(hardTotal),
  hardPerUnit: Math.round(hardTotal / unitCount),
  totalPriced: Math.round(totalPriced),
  laborHours: Math.round(laborHours),
  taskRows: rows.length,
}, null, 2));
