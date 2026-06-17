'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './context/AuthContext'
import SearchForm from './components/SearchForm'
import BusinessList from './components/BusinessList'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [businesses, setBusinesses] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const [history, setHistory] = useState([])
  const [accessChecked, setAccessChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }
    if (!loading && user) {
      checkAccess(user.id)
    }
  }, [user, loading])

  async function checkAccess(userId) {
    const { data } = await supabase
      .from('user_access')
      .select('paid')
      .eq('user_id', userId)
      .single()
    
    if (data?.paid === true) {
      setHasAccess(true)
      setAccessChecked(true)
      fetchHistory(userId)
    } else {
      router.push('/paywall')
    }
  }

  async function fetchHistory(userId) {
    try {
      const res = await fetch(`/api/search-history?userId=${userId}`)
      const data = await res.json()
      if (data.history) setHistory(data.history)
    } catch {}
  }

  async function handleSearch({ zip, category }) {
    setSearching(true)
    setError(null)
    try {
      const res = await fetch('/api/search-businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip, category, userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Search failed')
        setBusinesses([])
      } else {
        setBusinesses(data.businesses || [])
        fetchHistory(user.id)
      }
    } catch {
      setError('Network error')
    } finally {
      setSearching(false)
      setSearched(true)
    }
  }

  // Show nothing until we've confirmed access
  if (loading || !accessChecked || !hasAccess) return null

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-2">
              Lead finder
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold">
              Find nearby businesses &amp; their owners
            </h1>
            <p className="text-[var(--ink-soft)] mt-2 max-w-2xl text-sm">
              Enter a location and category to pull local businesses from Google Maps,
              then crawl each website for a personal email.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="text-xs text-[var(--ink-soft)] font-mono hidden sm:block">{user?.email}</p>
            <div className="flex gap-3">
              <button onClick={() => router.push('/saved')} className="text-sm underline text-[var(--ink-soft)] hover:text-[var(--ink)]">
                Saved leads
              </button>
              <button onClick={signOut} className="text-sm underline text-[var(--ink-soft)] hover:text-[var(--ink)]">
                Sign out
              </button>
            </div>
          </div>
        </header>

        <SearchForm onSearch={handleSearch} loading={searching} />

        {history.length > 0 && (
          <div className="mt-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-2">
              Recent searches
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSearch({ zip: item.location, category: item.category })}
                  className="text-sm bg-[var(--paper-card)] border border-[var(--line)] rounded-full px-3 py-1 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
                >
                  {item.location} — {item.category}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-6 text-sm text-[var(--error)] bg-[var(--error-bg)] rounded-md px-4 py-3">
            {error}
          </p>
        )}

        {searched && !searching && !error && businesses.length === 0 && (
          <p className="mt-8 text-[var(--ink-soft)]">No businesses found for that search.</p>
        )}

        <BusinessList businesses={businesses} userId={user?.id} />
      </div>
    </main>
  )
}
