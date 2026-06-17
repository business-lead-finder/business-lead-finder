'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else router.push('/')
    } else {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else {
        setMessage('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
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
        maxWidth: '400px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px',
            backgroundColor: '#5046e5',
            borderRadius: '12px',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '22px' }}>🔍</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111', margin: 0 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '16px' }}>✉️</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 12px 12px 40px',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '10px', fontSize: '15px',
                  color: '#111', outline: 'none',
                  backgroundColor: '#fafafa',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '16px' }}>🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 12px 12px 40px',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '10px', fontSize: '15px',
                  color: '#111', outline: 'none',
                  backgroundColor: '#fafafa',
                }}
              />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#c0392b', backgroundColor: '#fdecea', borderRadius: '8px', padding: '10px 12px', margin: 0 }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ fontSize: '13px', color: '#27ae60', backgroundColor: '#eafaf1', borderRadius: '8px', padding: '10px 12px', margin: 0 }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '13px',
              backgroundColor: loading ? '#a09de8' : '#5046e5',
              color: '#fff', border: 'none',
              borderRadius: '10px', fontSize: '15px',
              fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px', transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#888', margin: '0 0 10px' }}>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
            style={{
              width: '100%', padding: '13px',
              backgroundColor: '#fff',
              color: '#111', border: '1.5px solid #e0e0e0',
              borderRadius: '10px', fontSize: '15px',
              fontWeight: '600', cursor: 'pointer',
            }}
          >
            {mode === 'login' ? 'Create an account' : 'Sign in instead'}
          </button>
        </div>
      </div>
    </main>
  )
}
