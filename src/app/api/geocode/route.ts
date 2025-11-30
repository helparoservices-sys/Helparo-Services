import { NextRequest, NextResponse } from 'next/server'

type GeoResult = {
  formatted_address: string
  pincode: string | null
  state: string | null
  city: string | null
  lat: number
  lng: number
  source: 'google' | 'nominatim'
}

function component(components: any[], type: string): string | null {
  const c = components?.find((x: any) => x.types?.includes(type))
  return c?.long_name || c?.short_name || null
}

function norm(s: string | null | undefined) {
  return (s || '').trim()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = Number(searchParams.get('lat'))
    const lng = Number(searchParams.get('lng'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 })
    }

    const language = 'en-IN'

    // Try Google first if API key present
    const googleKey = process.env.GOOGLE_MAPS_API_KEY
    if (googleKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}&language=${language}`
        const gRes = await fetch(gUrl, { cache: 'no-store' })
        if (gRes.ok) {
          const gData = await gRes.json()
          const result = gData?.results?.[0]
          if (result) {
            const comps = result.address_components || []
            const city = norm(
              component(comps, 'locality') ||
              component(comps, 'postal_town') ||
              component(comps, 'sublocality') ||
              component(comps, 'administrative_area_level_2')
            ) || null
            const state = norm(component(comps, 'administrative_area_level_1')) || null
            const pincode = norm(component(comps, 'postal_code')) || null
            const payload: GeoResult = {
              formatted_address: result.formatted_address,
              pincode,
              state,
              city,
              lat,
              lng,
              source: 'google'
            }
            return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
          }
        }
      } catch {
        // fallthrough to nominatim
      }
    }

    // Fallback to Nominatim
    const nUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`
    const nRes = await fetch(nUrl, {
      headers: {
        'User-Agent': 'HelparoServices/1.0 (reverse-geocode)'
      },
      cache: 'no-store'
    })
    if (!nRes.ok) {
      return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 502 })
    }
    const nData = await nRes.json()
    const addr = nData?.address || {}
    const city = norm(addr.city || addr.town || addr.village || addr.suburb || addr.county) || null
    const state = norm(addr.state) || null
    const pincode = norm(addr.postcode || addr.postal_code) || null
    const formatted = norm(nData.display_name) || [
      addr.house_number,
      addr.road || addr.street,
      addr.suburb || addr.neighbourhood || addr.locality,
      addr.city || addr.town || addr.village,
      addr.state,
      addr.postcode
    ].filter(Boolean).join(', ')

    const payload: GeoResult = {
      formatted_address: formatted,
      pincode,
      state,
      city,
      lat,
      lng,
      source: 'nominatim'
    }
    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
