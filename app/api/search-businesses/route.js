import { supabase } from '../../../lib/supabase'

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function POST(request) {
  try {
    const { zip, category, userId } = await request.json()

    if (!zip || !category) {
      return Response.json({ error: 'Location and category are required' }, { status: 400 })
    }

    if (!GOOGLE_API_KEY) {
      return Response.json({ error: 'Server is missing GOOGLE_MAPS_API_KEY' }, { status: 500 })
    }

    // 1. Geocode the location to lat/lng
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)}&key=${GOOGLE_API_KEY}`
    )
    const geoData = await geoRes.json()

    if (!geoData.results?.length) {
      return Response.json({ error: `Could not find a location for "${zip}". Google status: ${geoData.status}` }, { status: 404 })
    }

    const { lat, lng } = geoData.results[0].geometry.location

    // 2. Nearby search for businesses
    const nearbyRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=8000&keyword=${encodeURIComponent(category)}&key=${GOOGLE_API_KEY}`
    )
    const nearbyData = await nearbyRes.json()

    if (nearbyData.status !== 'OK' && nearbyData.status !== 'ZERO_RESULTS') {
      return Response.json({ error: `Google Places error: ${nearbyData.status}` }, { status: 502 })
    }

    const places = (nearbyData.results || []).slice(0, 20)

    // 3. Get details for each place
    const businesses = await Promise.all(
      places.map(async (place) => {
        const detailsRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&key=${GOOGLE_API_KEY}`
        )
        const detailsData = await detailsRes.json()
        const details = detailsData.result || {}

        return {
          place_id: place.place_id,
          name: details.name || place.name,
          address: details.formatted_address || place.vicinity || null,
          zip,
          category,
          phone: details.formatted_phone_number || null,
          website: details.website || null,
          rating: details.rating ?? place.rating ?? null,
          rating_count: details.user_ratings_total ?? null,
        }
      })
    )

    // 4. Save search history with user_id
    try {
      const { error } = await supabase
        .from('search_history')
        .insert({ location: zip, category, user_id: userId || null })
      if (error) console.error('Supabase search_history error:', error.message)
    } catch (e) {
      console.error('Supabase exception:', e.message)
    }

    return Response.json({ businesses })
  } catch (err) {
    console.error('search-businesses error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
