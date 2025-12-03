import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    if (!q || q.length < 3) {
      return NextResponse.json({ results: [] })
    }

    const key = process.env.GOOGLE_MAPS_API_KEY
    
    if (!key) {
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
    }

    // Google Places Text Search (REQUIRED - no fallback)
    const gUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${key}&region=in`
    const gRes = await fetch(gUrl, { cache: 'no-store' })
    
    if (!gRes.ok) {
      return NextResponse.json({ results: [] }, { status: 200 })
    }
    
    const gData = await gRes.json()
    
    if (!Array.isArray(gData?.results)) {
      return NextResponse.json({ results: [] })
    }
    
    // Normalize shape to consumer expectations
    const results = gData.results.map((r: any) => {
      // Parse address_components to extract city, state, pincode
      const components = r.address_components || []
      let city = ''
      let state = ''
      let pincode = ''
      
      components.forEach((component: any) => {
        const types = component.types || []
        if (types.includes('locality')) {
          city = component.long_name
        } else if (types.includes('administrative_area_level_3') && !city) {
          city = component.long_name
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name
        } else if (types.includes('postal_code')) {
          pincode = component.long_name
        }
      })
      
      return {
        display_name: r.formatted_address || r.name,
        lat: r.geometry?.location?.lat?.toString?.() || '',
        lon: r.geometry?.location?.lng?.toString?.() || '',
        address: {
          city: city || null,
          state: state || null,
          pincode: pincode || null
        },
        source: 'google'
      }
    })
    
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
