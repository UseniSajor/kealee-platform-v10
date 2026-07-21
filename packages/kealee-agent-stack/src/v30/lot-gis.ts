/** Server-safe lot geocode + satellite URL (shared by API + web-main). */

export interface V30LotContext {
  address: string
  lat: number
  lng: number
  satelliteImageUrl: string | null
  googleEarthHint: string
  source: 'google_static' | 'coordinates_only'
  geocodedAt: string
}

async function geocodeNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(address.trim())
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
    headers: { 'User-Agent': 'KealeePlatform/1.0 (concept-layout)' },
  })
  if (!res.ok) return null
  const rows = (await res.json()) as Array<{ lat: string; lon: string }>
  if (!rows[0]) return null
  return { lat: Number(rows[0].lat), lng: Number(rows[0].lon) }
}

export async function resolveLotContext(address: string): Promise<V30LotContext | null> {
  const trimmed = address?.trim()
  if (!trimmed || trimmed.length < 5) return null
  const coords = await geocodeNominatim(trimmed)
  if (!coords) return null
  const googleKey = process.env.GOOGLE_MAPS_API_KEY
  const satelliteImageUrl = googleKey
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lng}&zoom=19&size=1024x1024&maptype=satellite&key=${googleKey}`
    : null
  return {
    address: trimmed,
    lat: coords.lat,
    lng: coords.lng,
    satelliteImageUrl,
    googleEarthHint: `Open ${coords.lat}, ${coords.lng} in Google Earth Pro or import CAD geoJson.`,
    source: satelliteImageUrl ? 'google_static' : 'coordinates_only',
    geocodedAt: new Date().toISOString(),
  }
}
