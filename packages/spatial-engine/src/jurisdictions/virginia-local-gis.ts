/**
 * Virginia counties beyond Fairfax and Arlington — each read from its OWN GIS,
 * the way PGAtlas is read. VGIN's statewide fabric is the last resort, not the
 * source, for these.
 *
 * Every layer below was probed live on 2026-09-26 against real addresses.
 *
 *   PRINCE WILLIAM  gisweb.pwcva.gov (native 2283; outSR=2248 honoured). Its
 *                   own locator PWC_AddressLocator_Engine2 scores the
 *                   street-only form at 100 on the county's premise-address
 *                   point ("3427 Grouse Ct" → PointAddress / Feature at
 *                   1222730, 366646). It ALSO answers with a centreline
 *                   interpolation at 100 some 170 ft away, so only point
 *                   candidates are taken. Parcels: CountyMapper/LandRecords/4
 *                   (GPIN, deed book/page, subdivision and lot). Zoning:
 *                   Planning/Zoning/5, the county's zoning districts.
 *                   The server refuses Python's default user agent (403);
 *                   Node's fetch is accepted.
 *   LOUDOUN         logis.loudoun.gov/gis (native 2924). The county
 *                   publishes no locator. VGIN's locator is compiled from the
 *                   county's address points — "42525 Carnforth Ct" lands
 *                   within 3 ft of the county point — so it is asked first,
 *                   restricted to Loudoun PointAddress candidates, and the
 *                   county's own address-point layer (LandRecords/2) is
 *                   matched exactly when it misses. Parcels: LandRecords/5
 *                   (MCPI, recorded plat number, legal square feet). Zoning:
 *                   COL/Zoning/3, which carries BOTH ordinances in force —
 *                   the 2023 Zoning Ordinance and the 1972 ordinance that
 *                   still governs some planned districts (ZO_ORDINANCE).
 *
 * Contours: neither county publishes a contour layer with a stated vertical
 * datum on its public services, so terrain is USGS 3DEP (NAVD88, stated).
 */

import type { ArcGisJurisdictionConfig } from './arcgis-jurisdiction'

const PWC = 'https://gisweb.pwcva.gov/arcgis/rest/services'
const LOCO = 'https://logis.loudoun.gov/gis/rest/services'
const VGIN = 'https://vginmaps.vdem.virginia.gov/arcgis/rest/services/Geocoding/VGIN_Composite_Locator/GeocodeServer'

export const PRINCE_WILLIAM_GIS: ArcGisJurisdictionConfig = {
  code: 'prince_william_va',
  name: 'Prince William County',
  state: 'VA',
  locators: [{
    name: 'Prince William County address locator (premise addresses)',
    url: `${PWC}/PWC_AddressLocator_Engine2/GeocodeServer`,
    // PointAddress = premise address point; Feature = the same point matched
    // on the premise-address table. StreetAddress is a centreline guess.
    acceptCandidate: c => ['PointAddress', 'Feature', 'POI', 'SubAddress'].includes(String(c.attributes.Addr_type ?? '')),
  }],
  addressPoints: {
    url: `${PWC}/CountyMapper/LandRecords/MapServer/2`, authority: 'Prince William County premise addresses',
    numberField: 'StreetNumber', nameField: 'StreetName', typeField: 'StreetType', zipField: 'ZipCode',
  },
  parcels: [{
    url: `${PWC}/CountyMapper/LandRecords/MapServer/4`, kind: 'parcel',
    authority: 'Prince William County — parcels', idFields: ['GPIN'],
    platReference: a => {
      const book = String(a.DeedBook ?? '').trim()
      const page = String(a.DeedPage ?? '').trim()
      const inst = String(a.DeedInstrument ?? '').trim()
      const sub = String(a.SubdivisionName ?? '').trim()
      const lot = String(a.LotNumber ?? '').trim()
      const deed = book && page ? `Deed Book ${book}, Page ${page}` : inst ? `Instrument ${inst}` : ''
      const parts = [sub && `${sub}${lot ? `, Lot ${lot}` : ''}`, deed].filter(Boolean)
      return parts.length ? parts.join(' — ') : null
    },
  }],
  zoning: { url: `${PWC}/Planning/Zoning/MapServer/5`, codeFields: ['ZoningDistrict'], authority: 'Prince William County — zoning districts' },
  streets: { urls: [`${PWC}/CountyMapper/BaseMap/MapServer/2`], nameFields: ['StreetName'], authority: 'Prince William County — road centrelines' },
  contours: '3dep',
}

export const LOUDOUN_GIS: ArcGisJurisdictionConfig = {
  code: 'loudoun_va',
  name: 'Loudoun County',
  state: 'VA',
  locators: [{
    name: 'VGIN statewide locator (Loudoun County address points)', url: VGIN,
    acceptCandidate: c =>
      String(c.attributes.Addr_type ?? '') === 'PointAddress' &&
      /loudoun/i.test(String(c.attributes.Subregion ?? '')),
  }],
  addressPoints: {
    url: `${LOCO}/COL/LandRecords/MapServer/2`, authority: 'Loudoun County address points',
    numberField: 'AD_ADDRESS', numericNumber: true, nameField: 'AM_STR_NAME', typeField: 'AM_STR_TYPE',
    prefixField: 'AM_DIR_PREF', zipField: 'AM_ZIP',
  },
  parcels: [{
    url: `${LOCO}/COL/LandRecords/MapServer/5`, kind: 'parcel',
    authority: 'Loudoun County — parcel boundaries', idFields: ['PA_MCPI'], areaField: 'PA_LEGAL_SQFT',
    platReference: a => {
      const plat = String(a.PA_PLAT_NUM ?? '').trim()
      const lot = String(a.PA_PLAT_LOT ?? '').trim()
      const sub = String(a.PA_SUBD_NAME ?? '').trim()
      if (!plat && !sub) return null
      return [sub, plat && `Plat ${plat}`, lot && `Lot ${lot}`].filter(Boolean).join(', ')
    },
  }],
  zoning: {
    url: `${LOCO}/COL/Zoning/MapServer/3`, codeFields: ['ZO_ZONE'], descriptionField: 'ZD_ZONE_NAME',
    authority: 'Loudoun County — zoning (2023 and 1972 ordinances)',
  },
  streets: { urls: [`${LOCO}/COL/StreetCenterline/MapServer/0`], nameFields: ['ST_FULLNAME'], authority: 'Loudoun County — street centerlines' },
  contours: '3dep',
}

export const VIRGINIA_LOCAL_CONNECTORS: ArcGisJurisdictionConfig[] = [PRINCE_WILLIAM_GIS, LOUDOUN_GIS]
