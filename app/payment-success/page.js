'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PaymentSuccessInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('verifying')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const userId = searchParams.get('userId')

    if (!sessionId || !userId) {
      router.push('/')
      return
    }

    fetch('/api/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus('success')
          setTimeout(() => router.push('/'), 3000)
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [])

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
        padding: '48px 32px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        textAlign: 'center',
      }}>
        {status === 'verifying' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>Verifying payment…</h2>
            <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#111' }}>You&apos;re in!</h2>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>
              Payment confirmed. Redirecting you to the app in a moment…
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111' }}>Something went wrong</h2>
            <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>
              Contact support if your payment went through.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{ marginTop: '20px', padding: '12px 24px', backgroundColor: '#5046e5', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
            >
              Go to app
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default function PaymentSuccess() {
  return (
    <Suspense>
      <PaymentSuccessInner />
    </Suspense>
  )
}
