import { supabase } from '../../../lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = supabase
      .from('search_history')
      .select('*')
      .order('searched_at', { ascending: false })
      .limit(10)

    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error.message)
      return Response.json({ history: [] })
    }

    return Response.json({ history: data })
  } catch (err) {
    return Response.json({ history: [] })
  }
}
