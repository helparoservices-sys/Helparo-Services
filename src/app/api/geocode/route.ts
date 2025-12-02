import { NextRequest, NextResponse } from 'next/server'

type GeoResult = {
  formatted_address: string
  pincode: string | null
  state: string | null
  city: string | null
  lat: number
  lng: number
  source: 'google'
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

    // Google Maps Geocoding API (REQUIRED)
    const googleKey = process.env.GOOGLE_MAPS_API_KEY
    if (!googleKey) {
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
    }

    const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}&language=${language}`
    const gRes = await fetch(gUrl, { cache: 'no-store' })
    
    if (!gRes.ok) {
      return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 502 })
    }

    const gData = await gRes.json()
    const result = gData?.results?.[0]
    
    if (!result) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
