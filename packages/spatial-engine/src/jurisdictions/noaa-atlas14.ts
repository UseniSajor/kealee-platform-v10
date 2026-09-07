/**
 * NOAA Atlas 14 precipitation frequency for the Rollins Avenue site.
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

export const NOAA_ATLAS14_SITE = {
  latitude: 38.8752,
  longitude: -76.9019,
  volume: 'Atlas 14 Volume 2 Version 3',
  region: 'Ohio River Basin and surrounding states',
  series: 'partial duration',
  units: 'in/hr',
  retrieved: '2026-09-07',
  citation: 'NOAA Atlas 14 Vol. 2 Ver. 3, PFDS point estimate, 38.8752 N 76.9019 W',
} as const

export const RETURN_PERIODS_YR = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000] as const
export const DURATIONS_MIN = [5, 10, 15, 30, 60] as const

/** Intensity, in/hr. Rows are DURATIONS_MIN, columns RETURN_PERIODS_YR. */
export const NOAA_INTENSITY_IN_PER_HR: number[][] = [
  [4.21, 5.05, 6.01, 6.71, 7.60, 8.26, 8.90, 9.53, 10.3, 10.9],
  [3.37, 4.04, 4.81, 5.36, 6.05, 6.58, 7.07, 7.55, 8.16, 8.60],
  [2.80, 3.38, 4.06, 4.52, 5.12, 5.55, 5.96, 6.35, 6.85, 7.20],
  [1.92, 2.34, 2.88, 3.28, 3.79, 4.18, 4.57, 4.94, 5.45, 5.83],
  [1.20, 1.47, 1.85, 2.13, 2.52, 2.83, 3.14, 3.47, 3.91, 4.26],
]

/**
 * Intensity for a duration and return period, interpolated linearly between the
 * published durations.
 *
 * A duration shorter than 5 minutes takes the 5-minute value: that is the floor
 * the table publishes and also the floor a time of concentration is held to.
 * Extrapolating below it would invent a number outside the source.
 */
export function noaaIntensity(durationMin: number, returnPeriodYr: number): number | null {
  const col = RETURN_PERIODS_YR.indexOf(returnPeriodYr as (typeof RETURN_PERIODS_YR)[number])
  if (col < 0) return null
  const d = Math.max(DURATIONS_MIN[0], durationMin)
  if (d >= DURATIONS_MIN[DURATIONS_MIN.length - 1]) {
    return NOAA_INTENSITY_IN_PER_HR[DURATIONS_MIN.length - 1][col]
  }
  for (let i = 0; i < DURATIONS_MIN.length - 1; i++) {
    const d0 = DURATIONS_MIN[i], d1 = DURATIONS_MIN[i + 1]
    if (d >= d0 && d <= d1) {
      const f = (d - d0) / (d1 - d0)
      const v0 = NOAA_INTENSITY_IN_PER_HR[i][col], v1 = NOAA_INTENSITY_IN_PER_HR[i + 1][col]
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
