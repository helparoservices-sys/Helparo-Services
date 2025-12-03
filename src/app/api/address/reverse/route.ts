import { NextRequest, NextResponse } from 'next/server'

/**
 * Reverse geocoding: Get address from coordinates
 * GET /api/address/reverse?lat=28.6139&lng=77.2090
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Use Nominatim (OpenStreetMap) for reverse geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Helparo-Services/1.0',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch address' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      address: {
        display_name: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        pincode: data.address?.postcode || '',
        country: data.address?.country || '',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      },
    })
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
