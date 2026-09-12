/**
 * NOAA Atlas 14 precipitation frequency, PER SITE.
 *
 * This carried ONE point estimate — Rollins Avenue, 38.8752 N 76.9019 W — as
 * module-level constants. The second project (Indian Queen East, Fort Foote
 * Road, about twelve miles south-west) then computed its drainage from Rollins
 * rainfall and, worse, its sheet cited Rollins' coordinates. The intensities
 * differ by under 2% at the ten-year storm, so nothing looked wrong; the
 * citation was simply for the wrong place, which is the kind of error a
 * reviewer catches and cannot unsee. Rainfall is a point lookup, so the site
 * is now a parameter.
 *
 * RETRIEVED, not assumed. The Rational Method needs a rainfall intensity and
 * this engine previously refused to compute a peak discharge without one — which
 * was right, but the answer to a missing input is to go and get it, not to print
 * the gap on a permit sheet.
 *
 * SOURCE  NOAA Atlas 14 Point Precipitation Frequency Estimates, Volume 2
 *         Version 3 (Ohio River Basin and surrounding states, which covers
 *         Maryland). Bonnin, Martin, Lin, Parzybok, Yekta and Riley.
 *         hdsc.nws.noaa.gov PFDS, partial duration series, English units,
 *         intensity in in/hr. Retrieved 2026-09-07 for 38.8752 N, 76.9019 W.
 *
 * The grid is the PFDS layout: 19 durations by 10 return periods. Only the
 * short durations are carried — a residential lot's time of concentration is
 * minutes, and a table nobody reads past row five is a table with more chances
 * to be wrong.
 */

export const RETURN_PERIODS_YR = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000] as const
export const DURATIONS_MIN = [5, 10, 15, 30, 60] as const

export interface NoaaSite {
  readonly id: string
  readonly label: string
  readonly latitude: number
  readonly longitude: number
  readonly volume: string
  readonly region: string
  readonly series: string
  readonly units: string
  readonly retrieved: string
  readonly citation: string
  /** Intensity, in/hr. Rows are DURATIONS_MIN, columns RETURN_PERIODS_YR. */
  readonly intensityInPerHr: readonly (readonly number[])[]
}

/** Rollins Avenue, Capitol Heights — Porter Subdivision lots 1 and 2. */
export const NOAA_SITE_ROLLINS: NoaaSite = {
  id: 'rollins-ave',
  label: 'Rollins Avenue, Capitol Heights',
  latitude: 38.8752,
  longitude: -76.9019,
  volume: 'Atlas 14 Volume 2 Version 3',
  region: 'Ohio River Basin and surrounding states',
  series: 'partial duration',
  units: 'in/hr',
  retrieved: '2026-09-07',
  citation: 'NOAA Atlas 14 Vol. 2 Ver. 3, PFDS point estimate, 38.8752 N 76.9019 W',
  intensityInPerHr: [
    [4.21, 5.05, 6.01, 6.71, 7.60, 8.26, 8.90, 9.53, 10.3, 10.9],
    [3.37, 4.04, 4.81, 5.36, 6.05, 6.58, 7.07, 7.55, 8.16, 8.60],
    [2.80, 3.38, 4.06, 4.52, 5.12, 5.55, 5.96, 6.35, 6.85, 7.20],
    [1.92, 2.34, 2.88, 3.28, 3.79, 4.18, 4.57, 4.94, 5.45, 5.83],
    [1.20, 1.47, 1.85, 2.13, 2.52, 2.83, 3.14, 3.47, 3.91, 4.26],
  ],
}

/**
 * Fort Foote Road, Fort Washington — Indian Queen East lots 53-56.
 *
 * Retrieved 2026-09-08 from the PFDS for 38.7611 N 77.0115 W, the geocoded
 * position of 9588 Fort Foote Rd. Partial duration series, English units,
 * intensity in in/hr, Atlas 14 Volume 2 Version 3, project area Ohio River
 * Basin — the same publication as the Rollins point, a different point.
 */
export const NOAA_SITE_FORT_FOOTE: NoaaSite = {
  id: 'fort-foote-rd',
  label: 'Fort Foote Road, Fort Washington',
  latitude: 38.7611,
  longitude: -77.0115,
  volume: 'Atlas 14 Volume 2 Version 3',
  region: 'Ohio River Basin',
  series: 'partial duration',
  units: 'in/hr',
  retrieved: '2026-09-08',
  citation: 'NOAA Atlas 14 Vol. 2 Ver. 3, PFDS point estimate, 38.7611 N 77.0115 W',
  intensityInPerHr: [
    [4.28, 5.14, 6.11, 6.83, 7.73, 8.40, 9.07, 9.72, 10.5, 11.2],
    [3.42, 4.11, 4.89, 5.45, 6.16, 6.69, 7.21, 7.70, 8.34, 8.81],
    [2.85, 3.44, 4.13, 4.60, 5.20, 5.65, 6.07, 6.48, 7.00, 7.38],
    [1.96, 2.38, 2.93, 3.33, 3.86, 4.25, 4.65, 5.04, 5.57, 5.97],
    [1.22, 1.49, 1.88, 2.17, 2.57, 2.88, 3.20, 3.54, 3.99, 4.36],
  ],
}

export const NOAA_SITES: readonly NoaaSite[] = [NOAA_SITE_ROLLINS, NOAA_SITE_FORT_FOOTE]

/**
 * The retrieved point nearest a location, or null when nothing is near.
 *
 * A point estimate is only valid near the point it was retrieved for. Beyond
 * the cap this returns NULL rather than the least-bad guess, because the
 * drainage module already knows how to say it has no intensity, and a rainfall
 * figure carried across the state is worse than an absent one.
 */
export function nearestNoaaSite(
  latitude: number, longitude: number, maxMiles = 15,
): NoaaSite | null {
  let best: NoaaSite | null = null
  let bestMi = Infinity
  for (const s of NOAA_SITES) {
    // Equirectangular is ample at this range.
    const dLat = (s.latitude - latitude) * 69.05
    const dLon = (s.longitude - longitude) * 69.05 * Math.cos((latitude * Math.PI) / 180)
    const mi = Math.hypot(dLat, dLon)
    if (mi < bestMi) { bestMi = mi; best = s }
  }
  return bestMi <= maxMiles ? best : null
}

/** Kept for callers that predate the per-site table. */
export const NOAA_ATLAS14_SITE = NOAA_SITE_ROLLINS
export const NOAA_INTENSITY_IN_PER_HR: readonly (readonly number[])[] =
  NOAA_SITE_ROLLINS.intensityInPerHr

/**
 * Intensity for a duration and return period, interpolated linearly between the
 * published durations.
 *
 * A duration shorter than 5 minutes takes the 5-minute value: that is the floor
 * the table publishes and also the floor a time of concentration is held to.
 * Extrapolating below it would invent a number outside the source.
 */
export function noaaIntensity(
  durationMin: number, returnPeriodYr: number, site: NoaaSite = NOAA_SITE_ROLLINS,
): number | null {
  const grid = site.intensityInPerHr
  const col = RETURN_PERIODS_YR.indexOf(returnPeriodYr as (typeof RETURN_PERIODS_YR)[number])
  if (col < 0) return null
  const d = Math.max(DURATIONS_MIN[0], durationMin)
  if (d >= DURATIONS_MIN[DURATIONS_MIN.length - 1]) {
    return grid[DURATIONS_MIN.length - 1][col]
  }
  for (let i = 0; i < DURATIONS_MIN.length - 1; i++) {
    const d0 = DURATIONS_MIN[i], d1 = DURATIONS_MIN[i + 1]
    if (d >= d0 && d <= d1) {
      const f = (d - d0) / (d1 - d0)
      const v0 = grid[i][col], v1 = grid[i + 1][col]
      return Number((v0 + (v1 - v0) * f).toFixed(3))
    }
  }
  return null
}

/**
 * Water quality storm depth for Maryland, inches.
 *
 * The Maryland Stormwater Design Manual sets WQv on a 1.0 in rainfall. It is a
 * fixed value for the State, not a site lookup.
 */
export const MD_WATER_QUALITY_RAINFALL_IN = 1.0
export const MD_WQV_CITATION =
  'Maryland Stormwater Design Manual, Vol. I & II — WQv on a 1.0 in rainfall'
