/**
 * Postcode geocoding + distance helpers for the instant-quote survey fee.
 *
 * Uses postcodes.io — a free, key-less, CORS-enabled UK postcode API — so the
 * same helpers run on the client (live "check my area") and the server (the
 * authoritative recompute in the quote action). Distances are straight-line
 * (haversine), which is what the survey-radius rule is defined against.
 */

export type LatLng = { lat: number; lng: number }

/** Look up a UK postcode's coordinates, or null if invalid/unreachable. */
export async function geocodePostcode(postcode: string): Promise<LatLng | null> {
  const clean = (postcode || '').replace(/\s+/g, '')
  if (!clean) return null
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
      // Cache postcode → coordinate lookups; they never change.
      next: { revalidate: 60 * 60 * 24 * 30 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      result?: { latitude?: number; longitude?: number } | null
    }
    const r = json?.result
    if (!r || typeof r.latitude !== 'number' || typeof r.longitude !== 'number') return null
    return { lat: r.latitude, lng: r.longitude }
  } catch {
    return null
  }
}

const EARTH_RADIUS_MILES = 3958.7613

/** Great-circle distance between two coordinates, in miles. */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Straight-line miles between a postcode and a base postcode, or null if
 * either fails to geocode (bad postcode / API down).
 */
export async function distanceMilesBetween(
  postcode: string,
  basePostcode: string,
): Promise<number | null> {
  const [a, b] = await Promise.all([geocodePostcode(postcode), geocodePostcode(basePostcode)])
  if (!a || !b) return null
  return haversineMiles(a, b)
}
