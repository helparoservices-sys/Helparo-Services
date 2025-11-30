import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 3) {
      return NextResponse.json({ results: [] })
    }

    const key = process.env.GOOGLE_MAPS_API_KEY

    // Prefer Google Places Text Search (returns geometry)
    if (key) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${key}&region=in`
        const gRes = await fetch(gUrl, { cache: 'no-store' })
        if (gRes.ok) {
          const gData = await gRes.json()
          if (Array.isArray(gData?.results)) {
            // Normalize shape to previous consumer expectations
            const results = gData.results.map((r: any) => ({
              display_name: r.formatted_address || r.name,
              lat: r.geometry?.location?.lat?.toString?.() || '',
              lon: r.geometry?.location?.lng?.toString?.() || '',
              address: {
                city: null,
                state: null,
                pincode: null
              },
              source: 'google'
            }))
            return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } })
          }
        }
      } catch {
        // fallthrough to fallback
      }
    }

    // Fallback: Nominatim search with India bias
    const nUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}, India&limit=5&addressdetails=1`
    const nRes = await fetch(nUrl, { headers: { 'Accept-Language': 'en' }, cache: 'no-store' })
    if (!nRes.ok) return NextResponse.json({ results: [] }, { status: 200 })
    const nData = await nRes.json()
    const results = Array.isArray(nData) ? nData.map((r: any) => ({
      display_name: r.display_name,
      lat: r.lat,
      lon: r.lon,
      address: r.address,
      source: 'nominatim'
    })) : []
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
