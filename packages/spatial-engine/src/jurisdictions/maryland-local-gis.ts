/**
 * Maryland counties beyond Prince George's and Montgomery — each read from its
 * OWN GIS, the way PGAtlas is read. Maryland's statewide fabric (MD iMAP) is
 * not used for these: the county publishes the address points, parcels and
 * the zoning map of record, and those are what a reviewer checks against.
 *
 * Every layer below was probed live on 2026-09-25 against a real address.
 *
 *   ANNE ARUNDEL  gis.aacounty.org. Its point-address locator matches ONLY
 *                 with the city or ZIP ("625 Irvin Ave, Deale, MD 20751" at
 *                 99; "625 Irvin Ave" at nothing), and the engine sends
 *                 street-only forms, so the county's own address-point layer
 *                 is asked on an exact number + street when the locator
 *                 misses. Zoning: "Zoning ADOPTED", the official digital
 *                 zoning layer. Its topo service states no vertical datum, so
 *                 terrain is USGS 3DEP.
 *   FREDERICK     fcgis.frederickcountymd.gov/server_pub (the public server;
 *                 /server needs a token). No public locator: the county's
 *                 address points are matched exactly. Zoning of record is
 *                 layer 1 ("Zoning", code in TYPE); municipalities that zone
 *                 their own land are layer 0.
 *   CALVERT       gis.calvertcountymd.gov. Point-address locator, parcel
 *                 fabric, and the zoning in effect March 1, 2025.
 *   ST. MARY'S    gis.stmaryscountymd.gov. Locator, address points, parcels
 *                 joined to SDAT (plat book/page), zoning in General4/4.
 *   CHARLES       the county's ArcGIS Online organisation (the one that
 *                 publishes the official zoning map layer). No locator:
 *                 CharlesCountyAddresses is matched exactly.
 *   HOWARD        GeoServer, not ArcGIS (see wfs-client.ts). Address points,
 *                 zoning and centrelines are the county's, in EPSG:2248. The
 *                 county publishes its property lines ONLY as a bulk download
 *                 (DataDownload/ESRI/property.zip) — its WFS "property" layer
 *                 is the county outline — so the lot polygon is read from
 *                 Maryland's statewide parcel fabric, which MDP compiles from
 *                 the county's cadastral data, and the source table says so.
 *
 * Contours: none of these services states a vertical datum on the layer, so
 * terrain is USGS 3DEP (NAVD88, stated), as for Arlington and Fairfax.
 */

import type { ArcGisJurisdictionConfig } from './arcgis-jurisdiction'

const AACO = 'https://gis.aacounty.org/arcgis/rest/services'
const FRED = 'https://fcgis.frederickcountymd.gov/server_pub/rest/services'
const CALV = 'https://gis.calvertcountymd.gov/server/rest/services'
const SMC = 'https://gis.stmaryscountymd.gov/server/rest/services'
const CHAS = 'https://services7.arcgis.com/3BMWkdyrt45RNCrq/arcgis/rest/services'
const HOWARD_WFS = 'wfs:https://hcgeoserver.howardcountymd.gov:8443/geoserver/general/ows'
const MD_IMAP_PARCELS = 'https://mdgeodata.md.gov/imap/rest/services/PlanningCadastre/MD_ParcelBoundaries/MapServer/0'

export const ANNE_ARUNDEL_GIS: ArcGisJurisdictionConfig = {
  code: 'anne_arundel_md',
  name: 'Anne Arundel County',
  state: 'MD',
  locators: [{
    name: 'Anne Arundel County address points locator',
    url: `${AACO}/GeocodeServices/AACo_AddressPoints_Locator_Pro/GeocodeServer`,
    acceptCandidate: c => String(c.attributes.Addr_type ?? '') === 'PointAddress',
  }],
  addressPoints: {
    url: `${AACO}/OpenData/Structure_OpenData/MapServer/0`,
    authority: 'Anne Arundel County address points',
    numberField: 'ST_NUMBER', nameField: 'ST_NAME', typeField: 'ST_TYPE', prefixField: 'ST_PREFIXD', zipField: 'ZIPCODE',
  },
  parcels: [{
    url: `${AACO}/OpenData/Planning_OpenData/MapServer/34`, kind: 'parcel',
    authority: 'Anne Arundel County — parcels (SDAT assessment)',
    idFields: ['ASST_ACCOUNT_NO'],
    platReference: a => {
      const plat = String(a.ASST_COUNTY_PLAT ?? '').trim()
      if (!plat || plat === '0') return null
      const block = String(a.ASST_COUNTY_BLOCK ?? '').trim()
      const lot = String(a.ASST_COUNTY_LOT_NO ?? '').trim()
      return `Plat ${plat}${block ? `, Block ${block}` : ''}${lot ? `, Lot ${lot}` : ''}`
    },
  }],
  zoning: {
    url: `${AACO}/OpenData/Planning_aacoPZProd_OpenData/MapServer/7`, codeFields: ['ZONED'],
    authority: 'Anne Arundel County OPZ — Zoning ADOPTED (official digital zoning)',
  },
  streets: {
    urls: [`${AACO}/OpenData/Transportation_OpenData/MapServer/5`],
    nameFields: ['NAMEFULL'], authority: 'Anne Arundel County — street centerlines',
  },
  contours: '3dep',
}

export const FREDERICK_GIS: ArcGisJurisdictionConfig = {
  code: 'frederick_md',
  name: 'Frederick County',
  state: 'MD',
  locators: [],
  addressPoints: {
    // Layer 0 ("Priority") carries the street type; layer 1 does not.
    url: `${FRED}/Basemap/Addresses/MapServer/0`, authority: 'Frederick County address points',
    numberField: 'ST_NUM', numericNumber: true, nameField: 'ST_NAME', typeField: 'ST_TYPE', prefixField: 'ST_PREFIX', zipField: 'ZIP_ADDR',
  },
  parcels: [{
    url: `${FRED}/Basemap/Parcels/MapServer/0`, kind: 'parcel',
    authority: 'Frederick County — parcels', idFields: ['TAX_ACCT'],
    platReference: a => a.Book && a.Page ? `Plat Book ${a.Book}, Page ${a.Page}${a.LOT ? `, Lot ${a.LOT}` : ''}` : null,
  }],
  zoning: {
    url: `${FRED}/PlanningAndPermitting/Zoning/MapServer/1`, codeFields: ['TYPE'],
    authority: 'Frederick County Planning & Permitting — zoning',
  },
  streets: {
    urls: [`${FRED}/Basemap/Centerlines/MapServer/0`],
    nameFields: ['ST_NAME'], authority: 'Frederick County — road centerlines',
  },
  contours: '3dep',
}

export const CALVERT_GIS: ArcGisJurisdictionConfig = {
  code: 'calvert_md',
  name: 'Calvert County',
  state: 'MD',
  locators: [{
    name: 'Calvert County address locator', url: `${CALV}/Locators/Addresses_Calvert/GeocodeServer`,
    acceptCandidate: c => String(c.attributes.Addr_type ?? '') === 'PointAddress',
  }],
  // The locator matches only with the city or ZIP; the county's public
  // address points answer the street-only form.
  addressPoints: {
    url: `${CALV}/Public_Safety/Addresses_public/MapServer/0`, authority: 'Calvert County address points',
    numberField: 'PREMSNUM', nameField: 'PREMSNAM', typeField: 'PREMSTYP', prefixField: 'PREMSDIR', zipField: 'PREMZIP',
  },
  parcels: [{
    url: `${CALV}/Countywide/Parcels/MapServer/0`, kind: 'parcel',
    authority: 'Calvert County — parcel fabric', idFields: ['Name'],
  }],
  zoning: {
    url: `${CALV}/Planning/Zoning/MapServer/0`, codeFields: ['ZONING'], descriptionField: 'ZONING_DESC',
    authority: 'Calvert County Planning & Zoning — zoning (effective March 1, 2025)',
  },
  streets: {
    urls: [`${CALV}/Countywide/Streets/MapServer/0`],
    nameFields: ['STREET', 'NAME'], authority: 'Calvert County — streets',
  },
  contours: '3dep',
}

const SMC_P = 'SDE.IT_Parcels.'
const SMC_S = 'SDE.IT_SDAT.'
export const ST_MARYS_GIS: ArcGisJurisdictionConfig = {
  code: 'st_marys_md',
  name: "St. Mary's County",
  state: 'MD',
  locators: [{
    name: "St. Mary's County address locator", url: `${SMC}/Geocoders/IT_Address_Geocode/GeocodeServer`,
    acceptCandidate: c => String(c.attributes.Addr_type ?? '') === 'PointAddress',
  }],
  addressPoints: {
    url: `${SMC}/Public/Primary/MapServer/2`, authority: "St. Mary's County address points",
    numberField: 'STREET_NUM', numericNumber: true, nameField: 'STREET_NAM', typeField: 'STREET_SUF_S', prefixField: 'STREET_PRFIX_L', zipField: 'ZIP',
  },
  parcels: [{
    url: `${SMC}/Public/Primary/MapServer/0`, kind: 'parcel',
    authority: "St. Mary's County — parcels (SDAT)", idFields: [`${SMC_P}ACCTID`],
    platReference: a => a[`${SMC_S}PlatBook`] && a[`${SMC_S}PlatPage`]
      ? `Plat Book ${a[`${SMC_S}PlatBook`]}, Page ${a[`${SMC_S}PlatPage`]}` : null,
  }],
  zoning: {
    url: `${SMC}/Public/General4/MapServer/4`, codeFields: ['CATEGORY'],
    authority: "St. Mary's County Land Use & Growth Management — zoning",
  },
  streets: {
    urls: [`${SMC}/Public/Primary/MapServer/1`],
    nameFields: ['SDE.IT_Centerlines.COMPLETE_STREET_NAME'], authority: "St. Mary's County — centerlines",
  },
  contours: '3dep',
}

export const CHARLES_GIS: ArcGisJurisdictionConfig = {
  code: 'charles_md',
  name: 'Charles County',
  state: 'MD',
  locators: [],
  addressPoints: {
    url: `${CHAS}/CharlesCountyAddresses/FeatureServer/0`, authority: 'Charles County address points',
    numberField: 'NUMBER_', numericNumber: true, nameField: 'Street_Nam', typeField: 'Street_typ', prefixField: 'Street_Pre', zipField: 'ZIP',
  },
  parcels: [{
    url: `${CHAS}/Tax_Parcels/FeatureServer/0`, kind: 'parcel',
    authority: 'Charles County — tax parcels', idFields: ['ACCTID'],
    platReference: a => a.PLAT_REF && String(a.PLAT_REF).trim() ? `Plat ${String(a.PLAT_REF).trim()}` : null,
  }],
  zoning: {
    url: `${CHAS}/Zoning/FeatureServer/0`, codeFields: ['ZONING', 'ZONE'], descriptionField: 'ZONE',
    authority: 'Charles County DPGM — official zoning map layer',
  },
  streets: {
    urls: [`${CHAS}/CharlesCountyCenterlines/FeatureServer/0`],
    nameFields: ['STREET'], authority: 'Charles County — centerlines',
  },
  contours: '3dep',
}

export const HOWARD_GIS: ArcGisJurisdictionConfig = {
  code: 'howard_md',
  name: 'Howard County',
  state: 'MD',
  locators: [],
  addressPoints: {
    url: `${HOWARD_WFS}#general:Address_Points#Shape`, authority: 'Howard County address points',
    numberField: 'ADDNUM', numericNumber: true, nameField: 'PREMSNAM', typeField: 'PREMSTYP', zipField: 'PREMZIP',
  },
  parcels: [{
    url: MD_IMAP_PARCELS, kind: 'parcel',
    authority: "Maryland Department of Planning — parcel boundaries (compiled from Howard County's cadastral layer, which the county publishes only as a download)",
    // LANDAREA is acres on some accounts and square feet on others; the ring is measured instead.
    idFields: ['ACCTID'],
    platReference: a => a.PLAT ? `Plat ${a.PLAT}${a.BLOCK ? `, Block ${a.BLOCK}` : ''}${a.LOT ? `, Lot ${a.LOT}` : ''}` : null,
  }],
  zoning: {
    url: `${HOWARD_WFS}#general:Zoning#geom`, codeFields: ['ZONE'],
    authority: 'Howard County DPZ — zoning',
  },
  streets: {
    urls: [`${HOWARD_WFS}#general:STREET_CENTERLINE_GEOMETRY#Shape`],
    nameFields: ['ROADNAME'], authority: 'Howard County — street centerlines',
  },
  contours: '3dep',
}

export const MARYLAND_LOCAL_CONNECTORS: ArcGisJurisdictionConfig[] = [
  ANNE_ARUNDEL_GIS, FREDERICK_GIS, CALVERT_GIS, ST_MARYS_GIS, CHARLES_GIS, HOWARD_GIS,
]
