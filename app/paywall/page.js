'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Paywall() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Re-check payment on mount — catches users returning from Stripe
  useEffect(() => {
    if (!user) return
    async function recheck() {
      const { data } = await supabase
        .from('user_access')
        .select('paid')
        .eq('user_id', user.id)
        .single()
      if (data?.paid === true) router.push('/')
    }
    recheck()
  }, [user])

  async function handlePayment() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px', height: '56px',
          backgroundColor: '#5046e5',
          borderRadius: '14px',
          margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px',
        }}>🔍</div>

        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: '0 0 8px' }}>
          Unlock Full Access
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: '0 0 28px', lineHeight: '1.5' }}>
          Get lifetime access to LeadTrail and start finding business owners&apos; contact details instantly.
        </p>

        <div style={{ textAlign: 'left', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            '🗺️ Search businesses anywhere in the world',
            '📧 Find owner email addresses',
            '💾 Save unlimited leads',
            '🕓 Personal search history',
          ].map((feature) => (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#333' }}>
              {feature}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '40px', fontWeight: '800', color: '#111' }}>$5</span>
          <span style={{ fontSize: '15px', color: '#888', marginLeft: '4px' }}>one-time</span>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: '#c0392b', backgroundColor: '#fdecea', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            backgroundColor: loading ? '#a09de8' : '#5046e5',
            color: '#fff', border: 'none',
            borderRadius: '10px', fontSize: '16px',
            fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '12px',
          }}
        >
          {loading ? 'Redirecting to payment…' : 'Pay $5 — Get Access'}
        </button>

        <button
          onClick={signOut}
          style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Sign out
        </button>
      </div>
    </main>
  )
}
