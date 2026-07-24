import fs from 'node:fs/promises'
import path from 'node:path'

const projectDir = path.resolve('docs/estimates/fort-washington-mixed-use')
const outputDir = path.join(projectDir, 'output')
await fs.mkdir(outputDir, { recursive: true })

const catalog = JSON.parse(await fs.readFile('data/ctc/ctc-cost-tasks.json', 'utf8'))
const laborRateCatalog = JSON.parse(await fs.readFile('data/ctc/ctc-labor-rates.json', 'utf8'))
const laborRates = laborRateCatalog.divisions
const byTask = new Map(catalog.tasks.map(task => [task.taskNumber, task]))
const money = value => Math.round(value)
const fmt = value => `$${money(value).toLocaleString('en-US')}`
const pct = value => `${(value * 100).toFixed(1)}%`
const csvCell = value => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
const toCsv = rows => `${rows.map(row => row.map(csvCell).join(',')).join('\n')}\n`

const program = {
  project: 'Fort Washington Mixed-Use Development',
  location: 'Fort Washington, Prince George’s County, Maryland 20744',
  zoningInput: 'CGO (user-provided assumption; not independently verified and not a legal opinion)',
  siteAcres: 10,
  landCost: 7_500_000,
  residentialUnits: 480,
  residentialGsf: 495_000,
  residentialNsfStated: 396_000,
  retailShellGsf: 80_000,
  occupiedGsf: 575_000,
  structuredSpaces: 300,
  surfaceSpaces: 450,
  structuredParkingGsf: 105_000,
  elevators: 8,
  phases: 2,
  buildings: [
    { name: 'A – primary podium/mixed-use', residentialGsf: 190_000, retailGsf: 80_000, floors: 6, footprint: 45_000 },
    { name: 'B – slab-on-grade wood frame', residentialGsf: 101_667, retailGsf: 0, floors: 4, footprint: 25_417 },
    { name: 'C – slab-on-grade wood frame', residentialGsf: 101_667, retailGsf: 0, floors: 4, footprint: 25_417 },
    { name: 'D – slab-on-grade wood frame', residentialGsf: 101_666, retailGsf: 0, floors: 4, footprint: 25_416 },
  ],
  unitMix: [
    { type: 'Studio', units: 48, targetNsf: 550 },
    { type: '1BR', units: 216, targetNsf: 700 },
    { type: '2BR', units: 168, targetNsf: 950 },
    { type: '3BR', units: 48, targetNsf: 1200 },
  ],
}

const calculatedNsf = program.unitMix.reduce((sum, unit) => sum + unit.units * unit.targetNsf, 0)
const unitNsfDifference = program.residentialNsfStated - calculatedNsf
const bathrooms = 48 + 216 + 168 * 2 + 48 * 2
const windows = 48 * 4 + 216 * 4 + 168 * 6 + 48 * 8
const footprint = program.buildings.reduce((sum, building) => sum + building.footprint, 0)
const facadeArea = program.buildings.reduce((sum, building) =>
  sum + 4 * Math.sqrt(building.footprint) * building.floors * (building.name.startsWith('A') ? 11.5 : 10.5), 0)
const roofArea = footprint
const residentialPartitionArea = program.residentialGsf * 3.2
const retailStorefrontArea = 12_000
const amenityArea = 22_000
const pavedRoadAndParkingArea = 450 * 330 + 110_000
const disturbedAreaSf = program.siteAcres * 43_560 * 0.78

const escalation = { labor: 1.15, material: 1.12, equipment: 1.125 }
// The catalog is Maryland DGS Central pricing. It is the most specific loaded
// geographic source, so no additional unsupported multiplier is imposed.
const locationFactor = 1.0
const productivityFactor = 1.0
const wasteByDivision = {
  '03': .05, '04': .07, '05': .05, '06': .10, '07': .08, '08': .05, '09': .08,
  '10': .03, '11': .02, '12': .08, '14': 0, '21': .05, '22': .07, '23': .04,
  '26': .07, '27': .07, '28': .04, '31': .10, '32': .08, '33': .10,
}
const divisionNames = {
  '01': 'General Requirements', '02': 'Existing Conditions', '03': 'Concrete',
  '04': 'Masonry', '05': 'Metals', '06': 'Wood, Plastics and Composites',
  '07': 'Thermal and Moisture Protection', '08': 'Openings', '09': 'Finishes',
  '10': 'Specialties', '11': 'Equipment', '12': 'Furnishings and Casework',
  '13': 'Special Construction', '14': 'Conveying Equipment',
  '21': 'Fire Suppression', '22': 'Plumbing', '23': 'HVAC', '26': 'Electrical',
  '27': 'Communications', '28': 'Electronic Safety and Security',
  '31': 'Earthwork', '32': 'Exterior Improvements', '33': 'Utilities',
}

const specs = []
const add = (taskId, quantity, quantityBasis, classification = 'Calculated', confidence = 'Medium', note = '') =>
  specs.push({ taskId, quantity, quantityBasis, classification, confidence, note })

add('01 74 19 00-0016', 144, 'Four 40-CY pulls/month × 36 months', 'Benchmark assumption')
add('01 71 36 00-0005', 24, 'Six full-day subsurface survey visits/building', 'Benchmark assumption')
add('02 90 20 00-0003', 8, 'Eight large stump removals; existing conditions unresolved', 'Benchmark assumption', 'Low')
add('03 31 13 00-0005', footprint + program.structuredParkingGsf / 4, '6-inch slab-on-grade at building and garage ground footprints')
add('03 31 13 00-0050', (program.structuredParkingGsf * .75 * .5 + 80_000 * .75) / 27,
  '6-inch elevated garage decks plus 9-inch equivalent podium transfer slab', 'Calculated')
add('03 22 11 00-0004', footprint + program.structuredParkingGsf, 'Welded reinforcing fabric at slabs', 'Calculated')
add('03 31 13 00-0019', 4_800, 'Conceptual continuous footing concrete', 'Benchmark assumption', 'Low')
add('03 11 13 00-0003', 42_000, 'Conceptual continuous-footing contact form area', 'Benchmark assumption', 'Low')
add('04 22 23 13-0006', 90_000, 'CMU stairs, shafts, service and garage walls', 'Calculated')
add('05 36 00 00-0042', program.structuredParkingGsf * .75 + 80_000, 'Composite deck at garage elevated floors and podium')
add('05 42 13 00-0013', 210_000, 'Conceptual cold-formed/secondary steel joist length', 'Benchmark assumption', 'Low')
add('06 11 16 00-0050', program.residentialGsf * .72, '2x6 stud length derived from residential GSF')
add('06 11 16 00-0015', program.residentialGsf * .68, '2x10 joist length equivalent for wood-framed floor assemblies')
add('06 16 43 00-0003', facadeArea, 'Exterior structural sheathing area')
add('06 41 13 00-0012', 480 * 11, 'Eleven 24-inch base/wall cabinet equivalents per apartment', 'Benchmark assumption')
add('07 21 16 00-0006', facadeArea, 'R-21 exterior wall insulation area')
add('07 24 13 00-0033', facadeArea, 'Exterior water-resistive membrane/air barrier')
add('07 46 46 00-0004', facadeArea * .65, '65% fiber-cement cladding baseline')
add('07 54 23 00-0004', roofArea / 100, '60-mil fully adhered TPO roof; CTC unit is roofing square')
add('08 53 13 00-0071', windows, 'Four/six/eight windows by unit type')
add('08 42 13 00-0002', 28, 'Building, amenity and retail entrance doors')
add('08 43 13 00-0008', retailStorefrontArea, '10-foot retail storefront framing')
add('08 12 13 13-0008', 480 + 4 * 80, 'Unit entries plus rated common/core frames')
add('09 29 10 00-0009', residentialPartitionArea, '3.2 SF Type-X board per residential GSF')
add('09 29 10 00-0038', residentialPartitionArea, 'Tape and finish matching board area')
add('09 65 23 00-0002', calculatedNsf * .70, 'LVP at 70% of apartment NSF')
add('09 30 13 00-0015', calculatedNsf * .12, 'Ceramic floor tile at 12% of apartment NSF')
add('09 68 13 00-0004', calculatedNsf * .18 / 9, 'Carpet at 18% of apartment NSF; CTC unit SY')
add('09 51 13 00-0003', 50_000, 'Retail/common acoustical ceilings; shell and amenity allowance')
add('09 91 23 00-0258', 480 * 6, 'Two-coat apartment interior door painting')
add('10 28 16 13-0083', bathrooms, 'One bath tissue dispenser per bathroom')
add('10 28 16 13-0039', bathrooms, 'One towel bar per bathroom')
add('10 28 16 13-0026', bathrooms, 'One shower rod per bathroom')
add('11 30 13 13-0050', 480, 'One 20–22 CF refrigerator per unit')
add('11 30 13 13-0005', 480, 'One 30-inch electric range per unit')
add('11 30 13 13-0082', 480, 'One 24-inch dishwasher per unit')
add('12 36 23 13-0003', 480 * 24, 'Twenty-four SF countertop per unit')
add('12 36 23 13-0005', 480 * 1.5, 'Countertop sink/faucet cutouts')
add('13 34 19 00-0164', 800, 'Entry canopies and amenity shade structures', 'Benchmark assumption')
add('13 11 46 00-0015', 4, 'Pool access ladders; pool vessel carried as unresolved allowance', 'Benchmark assumption', 'Low')
add('14 21 23 13-0004', 8, 'Eight 3,000-lb six-stop traction elevators; final code/core analysis required', 'User-provided', 'Medium')
add('21 13 13 00-0004', program.occupiedGsf / 180, 'Light-hazard wet-pipe coverage')
add('21 13 13 00-0006', program.structuredParkingGsf / 155, 'Garage ordinary-hazard wet-pipe coverage')
add('22 41 13 13-0002', bathrooms, 'One water closet per bathroom')
add('22 42 19 00-0013', bathrooms, 'One tub/shower assembly per bathroom')
add('22 41 16 16-0002', 480, 'One kitchen sink per unit')
add('22 41 39 00-0003', 480, 'One kitchen faucet per unit')
add('22 41 39 00-0012', bathrooms, 'One lavatory faucet per bathroom')
add('01 95 22 00-0006', bathrooms, 'One vanity per bathroom')
add('22 33 30 16-0004', 480, 'One 50-gallon electric water heater per unit')
add('23 81 13 11-0010', 48 + 216, 'One packaged terminal heat pump per studio/1BR')
add('23 81 49 00-0028', 168, 'One 17,500-BTU ductless heat pump per 2BR')
add('23 81 49 00-0029', 48, 'One 24,200-BTU ductless heat pump per 3BR')
add('01 95 23 00-0009', 480 * 2, 'Two residential exhaust fans per unit')
add('23 74 16 13-0002', 24, 'Retail/common-area packaged rooftop units at approximately one/3,300 SF')
add('26 24 16 00-0009', 480, 'One complete 100A, 24-circuit apartment panelboard')
add('01 95 26 00-0002', program.residentialGsf * 3, 'Three LF branch wiring per residential GSF')
add('01 95 26 00-0007', 480 * 8, 'Eight residential ceiling fixtures per unit')
add('26 05 33 16-0024', 480 * 24, 'Twenty-four duplex device/box equivalents per unit')
add('27 05 29 00-0004', 4_800, 'Communications cable supports; backbone/cable allowance')
add('28 46 13 31-0976', 4, 'One intelligent fire-alarm CPU per building')
add('01 95 26 00-0029', 480 * 2, 'Two combined CO/fire alarms per unit')
add('31 24 13 00-0004', 55_000, 'Conceptual cut/shape/rough-grade volume over 78% disturbed site', 'Benchmark assumption', 'Low')
add('31 23 16 33-0003', 65_000, 'Conceptual bulk excavation in soil', 'Benchmark assumption', 'Low')
add('32 11 16 16-0007', pavedRoadAndParkingArea / 9, 'Six-inch aggregate base at roads and surface parking')
add('32 12 16 13-0005', pavedRoadAndParkingArea / 9, 'Asphalt binder course at roads and surface parking')
add('32 16 23 00-0002', 65_000, 'Four-inch concrete walks')
add('32 16 13 13-0016', 9_000, 'Concrete curb and gutter')
add('26 56 13 00-0192', 42, 'Twenty-foot site light poles')
add('26 56 19 00-0238', 42, 'LED area fixtures')
add('33 14 13 39-0028', 3_500, 'Conceptual eight-inch water distribution')
add('33 31 11 00-0024', 3_500, 'Conceptual eight-inch PVC sanitary sewer')
add('33 42 11 00-0007', 4_500, 'Conceptual 24-inch RCP storm drainage')
add('33 42 31 00-0056', 24, 'Six-foot-deep catch basins')
add('33 14 19 00-0331', 6, 'Six-foot-burial three-way fire hydrants')

const exactLineItems = specs.map((spec, index) => {
  const task = byTask.get(spec.taskId)
  if (!task) throw new Error(`Existing CTC task not found: ${spec.taskId}`)
  const waste = wasteByDivision[task.csiDivision] ?? .03
  const material = task.materialCost2023 * escalation.material * spec.quantity * (1 + waste) * locationFactor
  const labor = task.laborCost2023 * escalation.labor * spec.quantity * productivityFactor * locationFactor
  const equipment = task.equipmentCost2023 * escalation.equipment * spec.quantity * locationFactor
  return {
    line: index + 1,
    ctcItemId: task.taskNumber,
    description: task.description,
    csiDivision: task.csiDivision,
    divisionName: divisionNames[task.csiDivision],
    unit: task.uom,
    quantity: spec.quantity,
    quantityBasis: spec.quantityBasis,
    quantityClassification: spec.classification,
    materialUnitPrice2023: task.materialCost2023,
    laborUnitCost2023: task.laborCost2023,
    laborRate2023: task.laborRate2023,
    laborRateCurrent: task.laborRate2023 * escalation.labor * locationFactor,
    laborRateSourceTask: task.laborRateSourceTask,
    laborRateTrade: task.laborRateTrade,
    laborHoursMethod: task.laborHoursMethod,
    equipmentUnitCost2023: task.equipmentCost2023,
    publishedDirectUnitPrice2023: task.unitPrice2023,
    laborHours: (task.laborCost2023 / task.laborRate2023) * spec.quantity * productivityFactor,
    material,
    labor,
    equipment,
    subcontractor: 0,
    wastePercent: waste,
    locationFactor,
    productivityFactor,
    escalationFactor: { ...escalation },
    extendedCost: material + labor + equipment,
    priceDataDate: 'June 2023',
    source: `_docs/Construction Task Catalog® - Distribution.pdf, page ${task.page}`,
    confidence: spec.confidence,
    notes: `${spec.note}${spec.note ? ' ' : ''}L/M/E and labor-hour splits are CTC-engine allocation fields; the published CTC price is bundled direct cost.`,
  }
})

// Complete-system checks already used by Kealee's existing mixed-use CTC model
// (`scripts/build_argona_cost_model.mjs`). Exact task takeoff above remains
// intact. Where it does not reach the existing subsystem basis, add only the
// residual and identify it as a benchmark assumption with no CTC task ID.
const subsystemTargets = {
  '02': { basis: 75_000 * 1.10, note: 'Minor existing-conditions allowance; demolition survey absent.' },
  '03': { basis: (program.occupiedGsf + program.structuredParkingGsf) * 46 * 1.14,
    note: 'Complete foundations, podium/garage structure, reinforcing, forming and concrete placement.' },
  '04': { basis: program.occupiedGsf * 6 * 1.13, note: 'Complete CMU, masonry veneer and accessories.' },
  '05': { basis: (program.occupiedGsf + program.structuredParkingGsf * .35) * 22 * 1.14,
    note: 'Primary/miscellaneous metals, podium/garage steel and railings.' },
  '06': { basis: program.residentialGsf * 31 * 1.13, note: 'Complete wood framing, sheathing, blocking and casework.' },
  '07': { basis: program.occupiedGsf * 21 * 1.14, note: 'Complete enclosure waterproofing, insulation, roofing and sealants.' },
  '08': { basis: program.occupiedGsf * 26 * 1.13, note: 'Complete windows, doors, hardware, glazing and storefront.' },
  '09': { basis: (program.residentialGsf + program.retailShellGsf * .45) * 38 * 1.12,
    note: 'Complete apartment, corridor, amenity and retail-shell finishes.' },
  '10': { basis: 480 * 4_200 * 1.11, note: 'Complete residential/common specialties, signage and mail/package systems.' },
  '11': { basis: 480 * 6_800 * 1.12, note: 'Complete appliance and common-equipment packages; retail equipment excluded.' },
  '12': { basis: 480 * 3_200 * 1.10, note: 'Complete casework, counters, blinds and amenity furnishings allowance.' },
  '13': { basis: 900_000 * 1.11, note: 'Pool vessel/equipment, canopies and normal site amenities.' },
  '14': { basis: 8 * 325_000 * 1.13, note: 'Eight complete elevator systems including controls and normal cab allowance.' },
  '21': { basis: (program.occupiedGsf + program.structuredParkingGsf) * 5.4 * 1.17,
    note: 'Complete sprinkler distribution, standpipe/fire-pump allowance and garage coverage.' },
  '22': { basis: 480 * 20_500 * 1.17, note: 'Complete fixtures, domestic water, sanitary/storm piping, risers and equipment.' },
  '23': { basis: program.occupiedGsf * 34 * 1.17, note: 'Complete apartment HVAC, DOAS/ventilation, retail shell and controls.' },
  '26': { basis: program.occupiedGsf * 29 * 1.17, note: 'Complete service, distribution, feeders, branch wiring, lighting and site power.' },
  '27': { basis: program.occupiedGsf * 4.5 * 1.15, note: 'Complete telecom backbone, cabling, pathways and rooms.' },
  '28': { basis: (program.occupiedGsf + program.structuredParkingGsf) * 4.7 * 1.15,
    note: 'Complete fire alarm, access control, CCTV and security.' },
  '31': { basis: program.siteAcres * 180_000 * 1.13, note: 'Clearing, grading, erosion control and normal soil handling.' },
  '32': { basis: program.siteAcres * 145_000 * 1.12,
    note: 'Roads, surface parking, curb, walks, landscape, hardscape and lighting.' },
  '33': { basis: 6_500_000 * 1.15, note: 'Water, sanitary, stormwater and dry-utility site allowance.' },
}
const lmeShares = {
  '02': [.45,.10,.45], '03': [.40,.45,.15], '04': [.50,.42,.08],
  '05': [.40,.50,.10], '06': [.50,.42,.08], '07': [.45,.45,.10],
  '08': [.40,.55,.05], '09': [.55,.40,.05], '10': [.40,.55,.05],
  '11': [.30,.60,.10], '12': [.35,.60,.05], '13': [.40,.45,.15],
  '14': [.35,.40,.25], '21': [.45,.45,.10], '22': [.50,.40,.10],
  '23': [.45,.45,.10], '26': [.55,.40,.05], '27': [.50,.45,.05],
  '28': [.50,.45,.05], '31': [.35,.15,.50], '32': [.40,.45,.15],
  '33': [.40,.40,.20],
}
const benchmarkLines = []
for (const [division, target] of Object.entries(subsystemTargets)) {
  const exact = exactLineItems.filter(line => line.csiDivision === division)
    .reduce((sum, line) => sum + line.extendedCost, 0)
  const residual = Math.max(0, target.basis - exact)
  if (!residual) continue
  const [laborShare, materialShare, equipmentShare] = lmeShares[division]
  const laborRate = laborRates[division]
  const currentLaborRate = laborRate.rate * escalation.labor * locationFactor
  benchmarkLines.push({
    line: exactLineItems.length + benchmarkLines.length + 1,
    ctcItemId: null,
    description: `${divisionNames[division]} complete-system residual`,
    csiDivision: division,
    divisionName: divisionNames[division],
    unit: 'LS',
    quantity: 1,
    quantityBasis: target.note,
    quantityClassification: 'Benchmark assumption',
    materialUnitPrice2023: null,
    laborUnitCost2023: null,
    equipmentUnitCost2023: null,
    publishedDirectUnitPrice2023: null,
    laborHours: residual * laborShare / currentLaborRate,
    laborRate2023: laborRate.rate,
    laborRateCurrent: currentLaborRate,
    laborRateSourceTask: laborRate.taskNumber,
    laborRateTrade: laborRate.trade,
    laborHoursMethod: laborRateCatalog.meta.method,
    material: residual * materialShare,
    labor: residual * laborShare,
    equipment: residual * equipmentShare,
    subcontractor: 0,
    wastePercent: 0,
    locationFactor,
    productivityFactor,
    escalationFactor: { ...escalation },
    extendedCost: residual,
    priceDataDate: 'June 2023 basis, July 2026 calibration',
    source: 'Existing Kealee CTC-calibrated mixed-use subsystem model: scripts/build_argona_cost_model.mjs',
    confidence: ['02','03','31','32','33'].includes(division) ? 'Low' : 'Medium',
    notes: 'No CTC item ID: this is the transparent residual between exact selected tasks and Kealee’s existing complete-system division check. Labor hours use the division-mapped published CTC hourly trade rate.',
  })
}
const lineItems = [...exactLineItems, ...benchmarkLines]

const divisionRows = Object.entries(divisionNames).map(([code, name]) => {
  const lines = lineItems.filter(line => line.csiDivision === code)
  const sum = key => lines.reduce((total, line) => total + line[key], 0)
  return {
    csiDivision: code, name, materials: sum('material'), labor: sum('labor'),
    laborHours: sum('laborHours'), equipment: sum('equipment'), subcontractor: sum('subcontractor'),
    total: sum('extendedCost'), costPerOccupiedGsf: sum('extendedCost') / program.occupiedGsf,
    costPerApartment: sum('extendedCost') / program.residentialUnits,
    confidence: lines.some(line => line.confidence === 'Low') ? 'Low' : lines.length ? 'Medium' : 'Unresolved',
    assumptions: [...new Set(lines.map(line => line.quantityBasis))].slice(0, 4),
  }
}).filter(row => row.total > 0)

const rawDirect = lineItems.reduce((sum, line) => sum + line.extendedCost, 0)
const exactCtcDirect = exactLineItems.reduce((sum, line) => sum + line.extendedCost, 0)
const generalConditions = rawDirect * .075
const insuranceBonds = rawDirect * .02
const contractorOverhead = rawDirect * .04
const contractorProfit = rawDirect * .05
const constructionContingency = rawDirect * .10
const contractHardCost = rawDirect + generalConditions + insuranceBonds + contractorOverhead +
  contractorProfit + constructionContingency

const softCosts = [
  ['Land purchase', 'User-provided', program.landCost],
  ['Acquisition and closing', '1.5% of land; title/legal/tax assumption', program.landCost * .015],
  ['Architecture and engineering', '6.5% of contract hard cost', contractHardCost * .065],
  ['Permits and impact fees', '3.0% allowance; County/WSSC schedules unresolved', contractHardCost * .03],
  ['Legal and entitlement', 'Conceptual allowance', 1_250_000],
  ['Testing and inspections', '0.75% of contract hard cost', contractHardCost * .0075],
  ['Owner insurance', '0.6% of contract hard cost', contractHardCost * .006],
  ['Taxes and carrying before financing', 'Conceptual allowance', 1_400_000],
  ['Developer fee', '3.5% of contract hard cost', contractHardCost * .035],
  ['Marketing and lease-up', '$4,000/unit plus retail launch', 480 * 4_000 + 400_000],
  ['Initial operating reserve', '$3,500/unit', 480 * 3_500],
  ['Owner contingency', '3.0% of contract hard cost', contractHardCost * .03],
]
const softBeforeFinancing = softCosts.reduce((sum, row) => sum + row[2], 0)
const baseBeforeFinancing = contractHardCost + softBeforeFinancing

function monthlyWeights(months) {
  const weights = Array.from({ length: months }, (_, i) => {
    const x = (i + .5) / months
    return Math.max(.01, Math.pow(x, 1.7) * Math.pow(1 - x, 1.5))
  })
  const total = weights.reduce((sum, value) => sum + value, 0)
  return weights.map(value => value / total)
}
function constructionFinance(months, ltc, annualRate) {
  const weights = monthlyWeights(months)
  const financedBasis = baseBeforeFinancing - program.landCost
  let balance = program.landCost * ltc
  let interest = 0
  const rows = weights.map((weight, index) => {
    const phase = index < Math.round(months * .58) ? 1 : 2
    const projectDraw = financedBasis * weight
    const loanDraw = projectDraw * ltc
    const opening = balance
    balance += loanDraw
    const monthInterest = ((opening + balance) / 2) * annualRate / 12
    interest += monthInterest
    return { month: index + 1, phase, projectDraw, loanDraw, openingBalance: opening,
      closingBalance: balance, interest: monthInterest }
  })
  const lenderFee = balance * .01
  const lenderLegal = 225_000
  const appraisal = 75_000
  const inspections = months * 8_500
  return { months, ltc, annualRate, loanBeforeInterest: balance, interest, lenderFee,
    lenderLegal, appraisal, inspections, totalFinancing: interest + lenderFee + lenderLegal + appraisal + inspections,
    rows }
}
const financingScenarios = []
for (const months of [30, 36, 42]) for (const ltc of [.65, .70, .75]) for (const rate of [.075, .085, .095]) {
  financingScenarios.push(constructionFinance(months, ltc, rate))
}
const baseFinance = constructionFinance(36, .70, .085)
const totalDevelopmentCost = baseBeforeFinancing + baseFinance.totalFinancing

const mortgageConstant = (annualRate, years = 30) => {
  const monthly = annualRate / 12
  const periods = years * 12
  return monthly * Math.pow(1 + monthly, periods) / (Math.pow(1 + monthly, periods) - 1) * 12
}
const permanentDebt = []
for (const rate of [.0575, .0625, .0675]) for (const ltv of [.60, .65, .70]) for (const dscrTarget of [1.25, 1.30]) {
  const loan = totalDevelopmentCost * ltv // TDC proxy only; appraisal is unresolved.
  const annualDebtService = loan * mortgageConstant(rate)
  const requiredNoi = annualDebtService * dscrTarget
  permanentDebt.push({ rate, ltv, dscrTarget, valueBasis: totalDevelopmentCost, loan,
    annualDebtService, requiredNoi, debtYieldAtThreshold: requiredNoi / loan,
    cashFlowAfterDebtAtThreshold: requiredNoi - annualDebtService,
    warning: 'Uses TDC as a temporary value proxy; stabilized appraisal and operating pro forma were not provided.' })
}

const tradeByDivision = {
  '01':'General conditions / laborers', '02':'Demolition / environmental', '03':'Concrete / reinforcing',
  '04':'Masonry', '05':'Ironworkers / misc. metals', '06':'Carpentry / casework',
  '07':'Roofing / waterproofing / insulation', '08':'Glazing / doors / hardware',
  '09':'Drywall / flooring / painting', '10':'Specialties installers', '11':'Equipment installers',
  '12':'Casework / furnishings', '13':'Special construction / pool', '14':'Elevator constructor',
  '21':'Fire sprinkler fitter', '22':'Plumbing', '23':'HVAC / sheet metal', '26':'Electrical',
  '27':'Low voltage / communications', '28':'Fire alarm / security', '31':'Earthwork',
  '32':'Paving / landscape / site electrical', '33':'Site utilities',
}
const crewByDivision = {
  '01':12,'02':8,'03':36,'04':20,'05':24,'06':80,'07':32,'08':28,'09':100,'10':16,'11':24,
  '12':20,'13':12,'14':16,'21':24,'22':56,'23':56,'26':64,'27':20,'28':16,'31':24,'32':36,'33':28,
}
const laborSummary = divisionRows.map(row => ({
  csiDivision: row.csiDivision, trade: tradeByDivision[row.csiDivision],
  laborHours: row.laborHours, conceptualCrew: crewByDivision[row.csiDivision],
  durationWeeksAtOneCrew: row.laborHours / (crewByDivision[row.csiDivision] * 40),
  note: 'Crews overlap by building and phase; duration is a production check, not the critical-path schedule.',
}))
const phaseEstimate = [
  { phase: 1, scope: 'Podium Building A, Building B, 50,000 SF retail, 300-space garage and primary site infrastructure',
    share: .60, contractHardCost: contractHardCost * .60, startMonth: 1, completionMonth: 27 },
  { phase: 2, scope: 'Buildings C and D, remaining 30,000 SF retail and final site/amenity work',
    share: .40, contractHardCost: contractHardCost * .40, startMonth: 11, completionMonth: 36 },
]
const parkingDirect = divisionRows.filter(row => ['03', '05', '21', '26', '28'].includes(row.csiDivision))
  .reduce((sum, row) => sum + row.total, 0) * (program.structuredParkingGsf / (program.occupiedGsf + program.structuredParkingGsf))
const structuredCostPerSpace = Math.max(28_000, parkingDirect / program.structuredSpaces)
const surfaceCostPerSpace = divisionRows.filter(row => ['31', '32'].includes(row.csiDivision))
  .reduce((sum, row) => sum + row.total, 0) / 450
const retailDirect = rawDirect * (program.retailShellGsf / program.occupiedGsf) * .75
const residentialVariablePerGsf = rawDirect * .72 / program.residentialGsf
const podiumPremiumPerGsf = 58
const subsystemChecks = [
  { subsystem:'Retail core and shell', quantity:80_000, unit:'GSF', directCost:retailDirect,
    contractCost:retailDirect * (contractHardCost/rawDirect), costPerUnit:retailDirect * (contractHardCost/rawDirect) / 80_000 },
  { subsystem:'Structured parking', quantity:300, unit:'spaces', directCost:parkingDirect,
    contractCost:structuredCostPerSpace * 300 * (contractHardCost/rawDirect), costPerUnit:structuredCostPerSpace * (contractHardCost/rawDirect) },
  { subsystem:'Surface/on-street parking', quantity:450, unit:'spaces',
    directCost:surfaceCostPerSpace*450, contractCost:surfaceCostPerSpace*450*(contractHardCost/rawDirect),
    costPerUnit:surfaceCostPerSpace*(contractHardCost/rawDirect) },
  { subsystem:'Site infrastructure', quantity:10, unit:'acres',
    directCost:divisionRows.filter(row=>['02','31','32','33'].includes(row.csiDivision)).reduce((s,x)=>s+x.total,0),
    contractCost:divisionRows.filter(row=>['02','31','32','33'].includes(row.csiDivision)).reduce((s,x)=>s+x.total,0)*(contractHardCost/rawDirect),
    costPerUnit:divisionRows.filter(row=>['02','31','32','33'].includes(row.csiDivision)).reduce((s,x)=>s+x.total,0)*(contractHardCost/rawDirect)/10 },
  { subsystem:'Elevators', quantity:8, unit:'cars', directCost:divisionRows.find(row=>row.csiDivision==='14').total,
    contractCost:divisionRows.find(row=>row.csiDivision==='14').total*(contractHardCost/rawDirect),
    costPerUnit:divisionRows.find(row=>row.csiDivision==='14').total*(contractHardCost/rawDirect)/8 },
  { subsystem:'MEP/FP/low voltage', quantity:680_000, unit:'constructed GSF',
    directCost:divisionRows.filter(row=>['21','22','23','26','27','28'].includes(row.csiDivision)).reduce((s,x)=>s+x.total,0),
    contractCost:divisionRows.filter(row=>['21','22','23','26','27','28'].includes(row.csiDivision)).reduce((s,x)=>s+x.total,0)*(contractHardCost/rawDirect),
    costPerUnit:divisionRows.filter(row=>['21','22','23','26','27','28'].includes(row.csiDivision)).reduce((s,x)=>s+x.total,0)*(contractHardCost/rawDirect)/680_000 },
]
const ve = [
  ['One podium + three wood buildings', 0, 'Baseline', 'Baseline', 'Balanced durability/cost; podium risk remains', 'Recommended baseline'],
  ['Two podium buildings', 101_667 * podiumPremiumPerGsf, '+2–4 months', 'Potentially lower envelope maintenance', 'Higher rent needed to cover cost', 'More concrete/steel durability', 'Use only if density/site constraints require'],
  ['All four podium buildings', 3 * 101_667 * podiumPremiumPerGsf, '+5–8 months', 'Potentially lower envelope maintenance', 'Material feasibility pressure', 'More concrete/steel durability', 'Not recommended at current program'],
  ['300 structured + 450 surface spaces', 0, 'Baseline', 'Baseline', 'Large surface footprint', 'Baseline', 'Recommended if site layout works'],
  ['450 structured + 300 surface spaces', 150 * (structuredCostPerSpace - surfaceCostPerSpace), '+2–4 months', 'Higher garage O&M', 'Improves land efficiency', 'Structured deck maintenance', 'Consider only if entitlement/site yield requires'],
  ['Construct 80,000 SF retail shell at once', 0, 'Baseline', 'Carries vacant-shell expense', 'Absorption risk', 'Baseline', 'Require leasing evidence'],
  ['50,000 SF Phase 1; defer 30,000 SF', -retailDirect * 30_000 / 80_000, 'Reduces Phase 1 duration; deferred scope later', 'Lower initial carrying cost', 'Future mobilization/escalation', 'No material change', 'Recommended without preleasing'],
  ['Reduce average unit size 5%', -program.residentialGsf * .05 * residentialVariablePerGsf, '-2–3 months', 'Slightly lower utility/turn cost', 'Marketability risk for larger units', 'Neutral', 'Test with market study'],
  ['Standardize Buildings B and C', -contractHardCost * .012, '-1–2 months', 'Simpler spares/maintenance', 'Reduced product differentiation', 'Neutral', 'Recommended'],
  ['Centralize amenities', -contractHardCost * .009, '-1 month', 'Lower staffing/maintenance', 'Longer walk for some residents', 'Fewer duplicated systems', 'Recommended'],
  ['Brick major elevations; fiber cement elsewhere', -facadeArea * .10 * 10, '-2–4 weeks', 'More repainting/recalking', 'Manageable if key elevations retain masonry', 'Lower impact resistance', 'Recommended with disciplined elevations'],
  ['Developer direct-purchase packages', -divisionRows.filter(row => ['06','09','11','12','22','23','26'].includes(row.csiDivision))
    .reduce((sum, row) => sum + row.materials, 0) * .08, 'Neutral to -1 month if procured early',
    'Owner assumes warranty/spares coordination', 'Low if substitutions are controlled', 'Depends on product', 'Recommended selectively'],
].map(([alternate, costDelta, scheduleEffect, operatingCostEffect, leasingRisk, durability, recommendation]) =>
  ({ alternate, costDelta, scheduleEffect, operatingCostEffect, leasingRisk, durability, recommendation }))

const rawLow = rawDirect * .90
const rawHigh = rawDirect * 1.15
const contractLow = contractHardCost * .90
const contractHigh = contractHardCost * 1.15
const tdcLow = totalDevelopmentCost * .92
const tdcHigh = totalDevelopmentCost * 1.14
const targetTests = [
  { target: 'Base hard construction $92M–$100M', result: rawDirect >= 92e6 && rawDirect <= 100e6,
    modeled: rawDirect, note: rawDirect < 92e6 ? 'Raw CTC direct cost is below target, but excludes contract markups.' : 'Compare scope before accepting.' },
  { target: 'Hard cost incl. contingency $97M–$105M', result: contractHardCost >= 97e6 && contractHardCost <= 105e6,
    modeled: contractHardCost, note: contractHardCost > 105e6 ? 'Podium, parking, MEP, site utilities and concept contingency prevent target.' : 'Within tested range.' },
  { target: 'TDC incl. land $130M–$145M', result: totalDevelopmentCost >= 130e6 && totalDevelopmentCost <= 145e6,
    modeled: totalDevelopmentCost, note: totalDevelopmentCost > 145e6 ? 'Soft costs, financing and reserves prevent target.' : 'Within tested range.' },
]

const estimate = {
  metadata: {
    estimateClass: 'Conceptual quantity-based CTC estimate',
    generatedAt: new Date().toISOString(),
    catalog: catalog.meta,
    catalogCoverage: `${catalog.tasks.length.toLocaleString('en-US')} extracted priced tasks`,
    priceBasis: 'June 2023 Maryland DGS Central; component escalation to July 2026',
    locationFactor, prevailingWage: 'CTC published direct prices include straight-time prevailing wage through working foreperson.',
    unionMbePremium: 'Not added; funding/procurement trigger was not provided.',
  },
  program,
  reconciliations: {
    calculatedUnitMixNsf: calculatedNsf,
    statedResidentialNsf: program.residentialNsfStated,
    difference: unitNsfDifference,
    calculatedAverageNsf: calculatedNsf / 480,
    statedAverageNsf: program.residentialNsfStated / 480,
    recommendation: 'Add 25 NSF to each studio (575 NSF) to reconcile exactly, or retain the 1,200-SF planning tolerance until schematic plans.',
  },
  quantities: { footprint, facadeArea, roofArea, residentialPartitionArea, bathrooms, windows,
    retailStorefrontArea, amenityArea, pavedRoadAndParkingArea, disturbedAreaSf },
  ctcRawEstimate: { lineItems, divisionRows, rawDirect, rawLow, rawHigh,
    exactCtcDirect, exactCtcCoveragePercent: exactCtcDirect / rawDirect,
    material: lineItems.reduce((s, x) => s + x.material, 0),
    labor: lineItems.reduce((s, x) => s + x.labor, 0),
    equipment: lineItems.reduce((s, x) => s + x.equipment, 0),
    laborHours: lineItems.reduce((s, x) => s + x.laborHours, 0) },
  constructionContract: { rawDirect, generalConditions, insuranceBonds, contractorOverhead,
    contractorProfit, constructionContingency, total: contractHardCost, low: contractLow, high: contractHigh },
  totalDevelopment: { softCosts: softCosts.map(([name, basis, amount]) => ({ name, basis, amount })),
    constructionFinancing: baseFinance, total: totalDevelopmentCost, low: tdcLow, high: tdcHigh },
  financingScenarios, permanentDebt, valueEngineering: ve, targetTests,
  exclusions: [
    'Retail tenant improvements, restaurant equipment and tenant-specific utility distribution.',
    'Unknown demolition, hazardous materials, rock, unsuitable soils, retaining walls and contaminated soil.',
    'Off-site utility capacity upgrades, WSSC system-development charges and power-company reinforcement unless explicitly quantified.',
    'Financing takeout sizing based on actual stabilized value/NOI; no rents, vacancy, concessions or operating expenses were provided.',
    'Professional zoning opinion; CGO is treated only as a user-provided input.',
  ],
  unresolved: [
    'Boundary/topographic survey, existing improvements and demolition survey.',
    'Geotechnical report, groundwater, bearing capacity, rock and unsuitable-soil/export requirements.',
    'Concept civil grading, stormwater/BMP, forest conservation, frontage and off-site road scope.',
    'WSSC water/sewer availability, connection charges, downstream capacity and fire-flow requirements.',
    'Building height, exact floor plates, construction type, podium transfer design and lateral system.',
    'Retail shell definition, tenant utility stubs, loading, grease/exhaust and preleasing.',
    'HVAC/DOAS basis, electrical service capacity, emergency power, EV charging and fire pump/standpipe.',
    'Public funding, prevailing-wage statute, project labor agreement and MBE participation requirements.',
    'Stabilized rents, retail rents, concessions, vacancy, operating expenses, cap rate and appraised value.',
  ],
}

await fs.writeFile(path.join(outputDir, 'fort-washington-ctc-estimate.json'), JSON.stringify(estimate, null, 2))
await fs.writeFile(path.join(outputDir, 'fort-washington-ctc-line-items.csv'), toCsv([
  ['Line','CTC Item ID','Description','CSI','Division','UOM','Quantity','Quantity Basis','Quantity Class',
    'Material Unit 2023','Labor Unit 2023','Equipment Unit 2023','Published Direct Unit 2023',
    'Labor Hours','CTC Labor Rate 2023','Current Labor Rate','Labor Rate Source Task','Mapped Trade','Labor Hours Method',
    'Waste %','Location Factor','Productivity Factor','Labor Esc.','Material Esc.','Equipment Esc.',
    'Material','Labor','Equipment','Subcontractor','Extended','Price Date','Source','Confidence','Notes'],
  ...lineItems.map(x => [x.line,x.ctcItemId,x.description,x.csiDivision,x.divisionName,x.unit,x.quantity,
    x.quantityBasis,x.quantityClassification,x.materialUnitPrice2023,x.laborUnitCost2023,x.equipmentUnitCost2023,
    x.publishedDirectUnitPrice2023,x.laborHours,x.laborRate2023,x.laborRateCurrent,x.laborRateSourceTask,
    x.laborRateTrade,x.laborHoursMethod,x.wastePercent,x.locationFactor,x.productivityFactor,
    x.escalationFactor.labor,x.escalationFactor.material,x.escalationFactor.equipment,x.material,x.labor,x.equipment,
    x.subcontractor,x.extendedCost,x.priceDataDate,x.source,x.confidence,x.notes]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-csi-summary.csv'), toCsv([
  ['CSI','Division','Materials','Labor','Labor Hours','Equipment','Subcontractor','Total','$/Occupied GSF','$/Apartment','Confidence','Major Assumptions'],
  ...divisionRows.map(x => [x.csiDivision,x.name,x.materials,x.labor,x.laborHours,x.equipment,x.subcontractor,
    x.total,x.costPerOccupiedGsf,x.costPerApartment,x.confidence,x.assumptions.join('; ')]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-monthly-draw.csv'), toCsv([
  ['Month','Phase','Project Draw','Loan Draw','Opening Loan Balance','Closing Loan Balance','Monthly Interest'],
  ...baseFinance.rows.map(row => [row.month,row.phase,row.projectDraw,row.loanDraw,row.openingBalance,row.closingBalance,row.interest]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-financing-scenarios.csv'), toCsv([
  ['Months','LTC','Interest Rate','Loan Before Interest','Capitalized Interest','Lender Fee','Legal','Appraisal','Inspections','Total Financing'],
  ...financingScenarios.map(x => [x.months,x.ltc,x.annualRate,x.loanBeforeInterest,x.interest,x.lenderFee,x.lenderLegal,x.appraisal,x.inspections,x.totalFinancing]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-permanent-debt.csv'), toCsv([
  ['Rate','LTV','DSCR Target','TDC Value Proxy','Loan','Annual Debt Service','Required NOI','Debt Yield at Threshold','Cash Flow After Debt at Threshold','Warning'],
  ...permanentDebt.map(x=>[x.rate,x.ltv,x.dscrTarget,x.valueBasis,x.loan,x.annualDebtService,x.requiredNoi,
    x.debtYieldAtThreshold,x.cashFlowAfterDebtAtThreshold,x.warning]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-value-engineering.csv'), toCsv([
  ['Alternate','Cost Delta','Schedule Effect','Operating Cost Effect','Leasing/Revenue Risk','Durability','Recommendation'],
  ...ve.map(x => [x.alternate,x.costDelta,x.scheduleEffect,x.operatingCostEffect,x.leasingRisk,x.durability,x.recommendation]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-materials-summary.csv'), toCsv([
  ['CSI','Division','Material Cost','Primary Basis'],
  ...divisionRows.map(x=>[x.csiDivision,x.name,x.materials,x.assumptions.join('; ')]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-labor-crew-summary.csv'), toCsv([
  ['CSI','Trade','Labor Hours','Conceptual Concurrent Crew','Duration Weeks at One Crew','Note'],
  ...laborSummary.map(x=>[x.csiDivision,x.trade,x.laborHours,x.conceptualCrew,x.durationWeeksAtOneCrew,x.note]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-equipment-summary.csv'), toCsv([
  ['CSI','Division','Equipment Cost','Primary Basis'],
  ...divisionRows.filter(x=>x.equipment>0).map(x=>[x.csiDivision,x.name,x.equipment,x.assumptions.join('; ')]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-subsystem-checks.csv'), toCsv([
  ['Subsystem','Quantity','Unit','Direct Cost','Contract Cost','Contract Cost Per Unit'],
  ...subsystemChecks.map(x=>[x.subsystem,x.quantity,x.unit,x.directCost,x.contractCost,x.costPerUnit]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-phasing.csv'), toCsv([
  ['Phase','Scope','Share','Contract Hard Cost','Start Month','Completion Month'],
  ...phaseEstimate.map(x=>[x.phase,x.scope,x.share,x.contractHardCost,x.startMonth,x.completionMonth]),
]))
await fs.writeFile(path.join(outputDir, 'fort-washington-soft-costs.csv'), toCsv([
  ['Soft Cost','Basis','Amount'],
  ...softCosts.map(([name,basis,amount])=>[name,basis,amount]),
  ['Construction financing','36 months / 70% LTC / 8.5%',baseFinance.totalFinancing],
]))

const table = (headers, rows) => [
  `| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`,
  ...rows.map(row => `| ${row.join(' | ')} |`),
].join('\n')
const topDivisions = [...divisionRows].sort((a, b) => b.total - a.total).slice(0, 8)
const report = `# Fort Washington Mixed-Use Development — CTC Conceptual Estimate

## Executive summary

This is a quantity-based conceptual estimate using exact task IDs and June 2023 published direct prices extracted from Kealee's licensed Maryland DGS Construction Task Catalog. It is not a bid, GMP, zoning opinion or lender-ready appraisal.

${table(['Metric','Expected','Low','High'], [
  ['CTC raw direct',fmt(rawDirect),fmt(rawLow),fmt(rawHigh)],
  ['Construction contract',fmt(contractHardCost),fmt(contractLow),fmt(contractHigh)],
  ['Total development cost',fmt(totalDevelopmentCost),fmt(tdcLow),fmt(tdcHigh)],
  ['Contract hard $/occupied GSF',fmt(contractHardCost/program.occupiedGsf),'—','—'],
  ['Contract hard $/apartment',fmt(contractHardCost/480),'—','—'],
  ['Total labor hours',Math.round(estimate.ctcRawEstimate.laborHours).toLocaleString('en-US'),'—','—'],
])}

## Program and area reconciliation

The four-building allocation reconciles to 495,000 residential GSF and 80,000 retail shell GSF. The 300-space garage adds approximately 105,000 constructed GSF and is not counted as occupied building area.

${table(['Building','Residential GSF','Retail GSF','Floors','Footprint'], program.buildings.map(b =>
  [b.name,b.residentialGsf.toLocaleString('en-US'),b.retailGsf.toLocaleString('en-US'),b.floors,b.footprint.toLocaleString('en-US')]))}

The proposed unit mix totals 480 units and **${calculatedNsf.toLocaleString('en-US')} NSF**, which is **${Math.abs(unitNsfDifference).toLocaleString('en-US')} NSF below** the stated 396,000 NSF. Its weighted average is ${(calculatedNsf/480).toFixed(1)} NSF versus the stated ${(396000/480).toFixed(1)} NSF. Add 25 NSF to each studio to reconcile exactly, or carry the 1,200-SF difference as a planning tolerance.

## Quantity summary

${table(['Quantity','Amount','Classification'], [
  ['Occupied building area','575,000 SF','User-provided'],
  ['Structured garage','105,000 GSF','Calculated at 350 GSF/space'],
  ['Building footprint',`${Math.round(footprint).toLocaleString('en-US')} SF`,'Calculated'],
  ['Exterior wall area',`${Math.round(facadeArea).toLocaleString('en-US')} SF`,'Calculated from conceptual square floor plates'],
  ['Roof area',`${Math.round(roofArea).toLocaleString('en-US')} SF`,'Calculated'],
  ['Interior partition finish area',`${Math.round(residentialPartitionArea).toLocaleString('en-US')} SF`,'Benchmark assumption'],
  ['Windows',windows.toLocaleString('en-US'),'Calculated from unit mix'],
  ['Bathrooms / fixture groups',bathrooms.toLocaleString('en-US'),'Calculated'],
  ['Elevators','8','User-provided; code/core validation unresolved'],
  ['Disturbed site area',`${Math.round(disturbedAreaSf).toLocaleString('en-US')} SF`,'Benchmark assumption'],
])}

## CTC raw estimate by CSI division

${table(['CSI','Division','Materials','Labor','Hours','Equipment','Total','$/GSF','$/Unit','Confidence'],
  divisionRows.map(x => [x.csiDivision,x.name,fmt(x.materials),fmt(x.labor),Math.round(x.laborHours).toLocaleString('en-US'),
    fmt(x.equipment),fmt(x.total),fmt(x.costPerOccupiedGsf),fmt(x.costPerApartment),x.confidence]))}

## Construction contract reconciliation

${table(['Component','Amount','Rate'], [
  ['CTC raw direct',fmt(rawDirect),'—'],
  ['General conditions',fmt(generalConditions),'7.5%'],
  ['Insurance and bonds',fmt(insuranceBonds),'2.0%'],
  ['Contractor overhead',fmt(contractorOverhead),'4.0%'],
  ['Contractor profit',fmt(contractorProfit),'5.0%'],
  ['Construction contingency',fmt(constructionContingency),'10.0%'],
  ['Construction contract estimate',fmt(contractHardCost),'—'],
])}

## Total development cost

${table(['Use','Basis','Amount'], [
  ['Construction contract','Quantity-based CTC',fmt(contractHardCost)],
  ...softCosts.map(([name,basis,amount]) => [name,basis,fmt(amount)]),
  ['Construction financing','36 months / 70% LTC / 8.5%',fmt(baseFinance.totalFinancing)],
  ['Total development cost','Expected scenario',fmt(totalDevelopmentCost)],
])}

## Highest-cost divisions

${table(['CSI','Division','Total'],topDivisions.map(x=>[x.csiDivision,x.name,fmt(x.total)]))}

## Value engineering

${table(['Alternate','Savings (cost)','Schedule','Operating cost','Leasing/revenue risk','Recommendation'],
  ve.map(x=>[x.alternate,`${x.costDelta<0?'-':'+'}${fmt(Math.abs(x.costDelta))}`,x.scheduleEffect,x.operatingCostEffect,x.leasingRisk,x.recommendation]))}

## Target tests

${table(['Target','Modeled','Result','Explanation'],targetTests.map(x=>[x.target,fmt(x.modeled),x.result?'Supported':'Not supported',x.note]))}

## Financing

The base monthly draw is in \`fort-washington-monthly-draw.csv\`. The full 27-scenario construction-loan sensitivity is in \`fort-washington-financing-scenarios.csv\`.

Permanent-debt tests use TDC only as a temporary value proxy because stabilized value and NOI were not supplied. The JSON output reports annual debt service and the required NOI/debt yield at 1.25x and 1.30x DSCR. Actual DSCR and cash flow after debt cannot be represented as known without rents, vacancy, concessions and operating expenses.

## Data quality and validation

- Catalog extraction: ${catalog.tasks.length.toLocaleString('en-US')} unique priced tasks; exact task IDs and PDF page provenance retained.
- Exact selected CTC tasks contribute ${fmt(exactCtcDirect)} (${pct(exactCtcDirect/rawDirect)}) of modeled direct cost. The balance is explicitly identified as complete-system residual allowances from Kealee's existing mixed-use subsystem model.
- Published CTC direct prices are bundled. Kealee allocates L/M/E by CSI ratios and derives hours by dividing allocated labor cost by the mapped published CTC hourly trade task. These are CTC-aligned derived hours, not published CTC crew hours.
- Maryland DGS Central is the most specific loaded CTC geography. No extra Fort Washington factor exists, so the transparent location factor is 1.000.
- Component escalation is 1.15 labor, 1.12 materials and 1.125 equipment from June 2023 to July 2026.
- Repository benchmark checks are diagnostic only: the PG County mixed-use record is $218/GSF and does not include enough scope detail to replace this estimate.
- Retail shell, garage, surface parking, site infrastructure, elevators and MEP are separately quantity-checked in the JSON and detailed line-item export.

## Exclusions and unresolved information

${estimate.exclusions.map(item=>`- ${item}`).join('\n')}

${estimate.unresolved.map(item=>`- ${item}`).join('\n')}

## Recommendation

Do not use this estimate as a lender commitment yet. Advance survey/topography, geotechnical, concept civil, schematic architecture, structural/podium narrative, MEP basis, WSSC/utility will-serve information, retail shell criteria and a stabilized operating pro forma. Then rerun the same CTC workflow with measured schematic quantities and obtain GC/subcontractor validation.
`
await fs.writeFile(path.join(outputDir, 'fort-washington-ctc-estimate-report.md'), report)

const validation = {
  generatedAt: new Date().toISOString(),
  checks: {
    unitCount: program.unitMix.reduce((sum,x)=>sum+x.units,0) === 480,
    buildingResidentialGsf: program.buildings.reduce((sum,x)=>sum+x.residentialGsf,0) === 495_000,
    occupiedGsf: program.residentialGsf + program.retailShellGsf === program.occupiedGsf,
    rawLineItemsReconcile: Math.abs(lineItems.reduce((s,x)=>s+x.extendedCost,0)-rawDirect)<.01,
    divisionsReconcile: Math.abs(divisionRows.reduce((s,x)=>s+x.total,0)-rawDirect)<.01,
    contractReconciles: Math.abs(rawDirect+generalConditions+insuranceBonds+contractorOverhead+
      contractorProfit+constructionContingency-contractHardCost)<.01,
    totalDevelopmentReconciles: Math.abs(contractHardCost+softBeforeFinancing+baseFinance.totalFinancing-totalDevelopmentCost)<.01,
    allExactIdsResolve: exactLineItems.every(x=>byTask.has(x.ctcItemId)),
    allExactPricesHavePages: exactLineItems.every(x=>x.source.includes('page ')),
    noInventedIdsOnAllowances: benchmarkLines.every(x=>x.ctcItemId===null),
    allLaborRatesResolveToCtcTasks: lineItems.every(x=>byTask.has(x.laborRateSourceTask)),
    laborCostHoursRateReconcile: lineItems.every(x=>Math.abs(x.labor - x.laborHours*x.laborRateCurrent)<.05),
  },
  benchmarkVariance: {
    repositoryPrinceGeorgesMixedUsePerOccupiedGsf: 218,
    modeledContractPerOccupiedGsf: contractHardCost/program.occupiedGsf,
    variancePercent: contractHardCost/program.occupiedGsf/218-1,
    explanation: 'The repository record is a small-project diagnostic benchmark with unspecified parking/site/soft scope. The CTC model includes podium, structured parking, full horizontal development, prevailing-wage JOC pricing, complete-system residuals, contract markups and 10% conceptual contingency.',
  },
}
if (Object.values(validation.checks).some(value=>value!==true)) throw new Error(`Estimate validation failed: ${JSON.stringify(validation.checks)}`)
await fs.writeFile(path.join(outputDir, 'fort-washington-validation.json'), JSON.stringify(validation,null,2))

console.log(JSON.stringify({
  outputDir, catalogTasks: catalog.tasks.length, lineItems: lineItems.length,
  rawDirect: money(rawDirect), contractHardCost: money(contractHardCost),
  totalDevelopmentCost: money(totalDevelopmentCost),
  hardCostPerUnit: money(contractHardCost / 480),
  hardCostPerOccupiedGsf: money(contractHardCost / 575_000),
  laborHours: money(estimate.ctcRawEstimate.laborHours),
}, null, 2))
