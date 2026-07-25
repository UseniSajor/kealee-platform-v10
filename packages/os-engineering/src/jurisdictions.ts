export type JurisdictionAutomationStatus = 'DETERMINISTIC_RULES' | 'SOURCE_LOOKUP_REQUIRED';

export interface JurisdictionSource {
  kind: 'ZONING_CODE' | 'ZONING_MAP' | 'BUILDING_PERMITS' | 'GIS';
  title: string;
  url: string;
}

export interface EngineeringJurisdiction {
  code: string;
  name: string;
  state: 'DC' | 'MD' | 'VA';
  automationStatus: JurisdictionAutomationStatus;
  lastVerifiedDate: string;
  sources: JurisdictionSource[];
}

const VERIFIED = '2026-07-23';

/**
 * DMV jurisdictions supported by the engineering intake boundary.
 *
 * SOURCE_LOOKUP_REQUIRED means the jurisdiction is discoverable, but geometry
 * generation must stop until the parcel's exact zone/overlay and an effective,
 * versioned dimensional rule are resolved. It must never fall back to ZIP-code
 * assumptions or a neighboring jurisdiction's setbacks.
 */
export const DMV_ENGINEERING_JURISDICTIONS: readonly EngineeringJurisdiction[] = [
  {
    code: 'US-DC-DC',
    name: 'District of Columbia',
    state: 'DC',
    automationStatus: 'SOURCE_LOOKUP_REQUIRED',
    lastVerifiedDate: VERIFIED,
    sources: [
      { kind: 'ZONING_CODE', title: 'DC Zoning Regulations of 2016', url: 'https://dcoz.dc.gov/page/zoning-regulations-2016' },
      { kind: 'ZONING_MAP', title: 'Official DC Zoning Map', url: 'https://maps.dcoz.dc.gov/' },
      { kind: 'BUILDING_PERMITS', title: 'DC Department of Buildings permits', url: 'https://dob.dc.gov/service/get-building-permit' },
      { kind: 'GIS', title: 'DC GIS zoning map service', url: 'https://maps2.dcgis.dc.gov/dcgis/rest/services/Zoning/MapServer' },
    ],
  },
  {
    code: 'US-MD-MONTGOMERY',
    name: 'Montgomery County',
    state: 'MD',
    automationStatus: 'SOURCE_LOOKUP_REQUIRED',
    lastVerifiedDate: VERIFIED,
    sources: [
      { kind: 'ZONING_CODE', title: 'Montgomery County Zoning Ordinance', url: 'https://montgomeryplanning.org/development/zoning/' },
      { kind: 'ZONING_MAP', title: 'MCAtlas', url: 'https://mcatlas.org/' },
      { kind: 'BUILDING_PERMITS', title: 'Montgomery County DPS permits', url: 'https://www.montgomerycountymd.gov/DPS/' },
      { kind: 'GIS', title: 'Montgomery County GIS Open Data', url: 'https://data-montgomerycountymd.opendata.arcgis.com/' },
    ],
  },
  {
    code: 'US-MD-PRINCE_GEORGES',
    name: "Prince George's County",
    state: 'MD',
    automationStatus: 'DETERMINISTIC_RULES',
    lastVerifiedDate: VERIFIED,
    sources: [
      { kind: 'ZONING_CODE', title: "Prince George's County Zoning Ordinance", url: 'https://www.pgplanning.org/countywide-planning/zoning/zoning-ordinance' },
      { kind: 'ZONING_MAP', title: 'PGAtlas', url: 'https://www.pgatlas.com/' },
      { kind: 'BUILDING_PERMITS', title: 'DPIE permits', url: 'https://www.princegeorgescountymd.gov/departments-offices/permitting-inspections-and-enforcement' },
      { kind: 'GIS', title: "Prince George's County Open Data", url: 'https://gisdata.pgplanning.org/opendata/' },
    ],
  },
  {
    code: 'US-VA-ARLINGTON',
    name: 'Arlington County',
    state: 'VA',
    automationStatus: 'SOURCE_LOOKUP_REQUIRED',
    lastVerifiedDate: VERIFIED,
    sources: [
      { kind: 'ZONING_CODE', title: 'Arlington County Zoning Ordinance', url: 'https://www.arlingtonva.us/Government/Programs/Building/Codes-Ordinances/Zoning' },
      { kind: 'ZONING_MAP', title: 'Arlington GIS zoning map', url: 'https://gisdata-arlgis.opendata.arcgis.com/' },
      { kind: 'BUILDING_PERMITS', title: 'Arlington permits and inspections', url: 'https://www.arlingtonva.us/Government/Programs/Building/Permits' },
      { kind: 'GIS', title: 'Arlington Open Data', url: 'https://gisdata-arlgis.opendata.arcgis.com/' },
    ],
  },
  {
    code: 'US-VA-ALEXANDRIA',
    name: 'City of Alexandria',
    state: 'VA',
    automationStatus: 'SOURCE_LOOKUP_REQUIRED',
    lastVerifiedDate: VERIFIED,
    sources: [
      { kind: 'ZONING_CODE', title: 'Alexandria Zoning Ordinance', url: 'https://www.alexandriava.gov/zoning/zoning-ordinance' },
      { kind: 'ZONING_MAP', title: 'Alexandria zoning map', url: 'https://www.alexandriava.gov/gis' },
      { kind: 'BUILDING_PERMITS', title: 'Alexandria permits', url: 'https://www.alexandriava.gov/permits' },
      { kind: 'GIS', title: 'Alexandria GIS', url: 'https://www.alexandriava.gov/gis' },
    ],
  },
  {
    code: 'US-VA-FAIRFAX_COUNTY',
    name: 'Fairfax County',
    state: 'VA',
    automationStatus: 'SOURCE_LOOKUP_REQUIRED',
    lastVerifiedDate: VERIFIED,
    sources: [
      { kind: 'ZONING_CODE', title: 'Fairfax County Zoning Ordinance', url: 'https://www.fairfaxcounty.gov/planning-development/zoning-ordinance' },
      { kind: 'ZONING_MAP', title: 'Fairfax County Jade map', url: 'https://www.fairfaxcounty.gov/gisapps/Jade/' },
      { kind: 'BUILDING_PERMITS', title: 'Fairfax County PLUS', url: 'https://www.fairfaxcounty.gov/plan2build/plus' },
      { kind: 'GIS', title: 'Fairfax County GIS and Mapping', url: 'https://www.fairfaxcounty.gov/maps/' },
    ],
  },
  {
    code: 'US-VA-LOUDOUN',
    name: 'Loudoun County',
    state: 'VA',
    automationStatus: 'SOURCE_LOOKUP_REQUIRED',
    lastVerifiedDate: VERIFIED,
    sources: [
      { kind: 'ZONING_CODE', title: 'Loudoun County Zoning Ordinance', url: 'https://www.loudoun.gov/zoningordinance' },
      { kind: 'ZONING_MAP', title: 'Loudoun County WebLogis', url: 'https://logis.loudoun.gov/weblogis/' },
      { kind: 'BUILDING_PERMITS', title: 'Loudoun County permits', url: 'https://www.loudoun.gov/121/Building-Development' },
      { kind: 'GIS', title: 'Loudoun GeoHub', url: 'https://geohub-loudoungis.hub.arcgis.com/' },
    ],
  },
  {
    code: 'US-VA-PRINCE_WILLIAM',
    name: 'Prince William County',
    state: 'VA',
    automationStatus: 'SOURCE_LOOKUP_REQUIRED',
    lastVerifiedDate: VERIFIED,
    sources: [
      { kind: 'ZONING_CODE', title: 'Prince William County Zoning Ordinance', url: 'https://www.pwcva.gov/department/planning-office/zoning-ordinance' },
      { kind: 'ZONING_MAP', title: 'Prince William County Mapper', url: 'https://gisweb.pwcva.gov/webapps/CountyMapper/' },
      { kind: 'BUILDING_PERMITS', title: 'Prince William County permits', url: 'https://www.pwcva.gov/department/development-services' },
      { kind: 'GIS', title: 'Prince William County GIS', url: 'https://www.pwcva.gov/department/gis' },
    ],
  },
] as const;

export function getEngineeringJurisdiction(code: string): EngineeringJurisdiction | undefined {
  return DMV_ENGINEERING_JURISDICTIONS.find((jurisdiction) => jurisdiction.code === code);
}

export function assertJurisdictionAutomationReady(code: string): EngineeringJurisdiction {
  const jurisdiction = getEngineeringJurisdiction(code);
  if (!jurisdiction) {
    throw new Error(`Unsupported engineering jurisdiction: ${code}`);
  }
  if (jurisdiction.automationStatus !== 'DETERMINISTIC_RULES') {
    throw new Error(
      `${jurisdiction.name} requires exact parcel zone/overlay resolution and versioned local rules before automated site-plan geometry.`,
    );
  }
  return jurisdiction;
}
