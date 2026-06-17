import Stripe from 'stripe'
import { supabase } from '../../../lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(request) {
  try {
    const { sessionId, userId } = await request.json()

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // Mark user as paid in Supabase
    const { error } = await supabase
      .from('user_access')
      .upsert({ user_id: userId, paid: true, paid_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (error) {
      console.error('Supabase error:', error.message)
      return Response.json({ error: 'Failed to grant access' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('confirm-payment error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
