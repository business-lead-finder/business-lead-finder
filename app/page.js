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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [view, setView] = useState('search') // search | saved

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
    setView('search')
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

  if (loading || !accessChecked || !hasAccess) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '0',
        minWidth: sidebarOpen ? '260px' : '0',
        overflow: 'hidden',
        transition: 'all 0.25s ease',
        backgroundColor: '#fff',
        borderRight: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#5046e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🔍</div>
            <span style={{ fontWeight: '700', fontSize: '15px', color: '#111' }}>LeadTrail</span>
          </div>
        </div>

        {/* New Search button */}
        <div style={{ padding: '12px' }}>
          <button
            onClick={() => { setView('search'); setBusinesses([]); setSearched(false) }}
            style={{
              width: '100%', padding: '10px 14px',
              backgroundColor: '#5046e5', color: '#fff',
              border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>+</span> New Search
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ padding: '4px 12px', flex: 1, overflowY: 'auto' }}>
          <button
            onClick={() => setView('saved')}
            style={{
              width: '100%', padding: '10px 12px',
              backgroundColor: view === 'saved' ? '#f0efff' : 'transparent',
              color: view === 'saved' ? '#5046e5' : '#444',
              border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '500',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '10px',
              textAlign: 'left', marginBottom: '4px',
            }}
          >
            <span>🔖</span> Saved Leads
          </button>

          {/* Search History */}
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 4px 8px' }}>
              Search History
            </p>
            {history.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#bbb', padding: '0 4px' }}>No recent searches</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSearch({ zip: item.location, category: item.category })}
                  style={{
                    width: '100%', padding: '8px 12px',
                    backgroundColor: 'transparent',
                    color: '#555', border: 'none',
                    borderRadius: '8px', fontSize: '13px',
                    cursor: 'pointer', textAlign: 'left',
                    display: 'block', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                >
                  🕐 {item.location} — {item.category}
                </button>
              ))
            )}
          </div>
        </nav>

        {/* User info + sign out */}
        <div style={{ padding: '12px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#5046e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: '600', flexShrink: 0 }}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
          </div>
          <button
            onClick={signOut}
            style={{
              width: '100%', padding: '9px 12px',
              backgroundColor: 'transparent', color: '#888',
              border: 'none', borderRadius: '8px',
              fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>↪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, backgroundColor: '#f9f9f9', overflowY: 'auto' }}>
        {/* Top bar */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#555', padding: '4px' }}
          >
            ☰
          </button>
          <span style={{ fontWeight: '600', fontSize: '15px', color: '#111' }}>
            {view === 'search' ? 'Find Businesses' : 'Saved Leads'}
          </span>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
          {view === 'search' && (
            <>
              <SearchForm onSearch={handleSearch} loading={searching} />

              {error && (
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#fdecea', borderRadius: '8px', color: '#c0392b', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              {searched && !searching && !error && businesses.length === 0 && (
                <p style={{ marginTop: '32px', color: '#999', textAlign: 'center' }}>No businesses found for that search.</p>
              )}

              <BusinessList businesses={businesses} userId={user?.id} />
            </>
          )}

          {view === 'saved' && (
            <SavedLeadsView userId={user?.id} />
          )}
        </div>
      </main>
    </div>
  )
}

function SavedLeadsView({ userId }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch_leads() {
      const { data } = await supabase
        .from('saved_leads')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })
      setLeads(data || [])
      setLoading(false)
    }
    if (userId) fetch_leads()
  }, [userId])

  async function removeLead(id) {
    await supabase.from('saved_leads').delete().eq('id', id)
    setLeads(leads.filter(l => l.id !== id))
  }

  if (loading) return <p style={{ color: '#999' }}>Loading saved leads…</p>

  if (leads.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <p style={{ color: '#999', fontSize: '15px' }}>No saved leads yet.</p>
      <p style={{ color: '#bbb', fontSize: '13px', marginTop: '8px' }}>Save businesses from your search results.</p>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
      {leads.map((lead) => (
        <div key={lead.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111', margin: 0 }}>{lead.business_name}</h3>
            <button onClick={() => removeLead(lead.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
          </div>
          {lead.address && <p style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>{lead.address}</p>}
          <div style={{ fontSize: '13px', color: '#555', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {lead.phone && <span>📞 {lead.phone}</span>}
            {lead.email && <span style={{ color: '#5046e5' }}>✉️ {lead.email}</span>}
            {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none' }}>🌐 {lead.website.replace(/^https?:\/\//, '')}</a>}
          </div>
          {lead.category && <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '11px', color: '#999', backgroundColor: '#f5f5f5', borderRadius: '20px', padding: '3px 10px' }}>{lead.category}</span>}
        </div>
      ))}
    </div>
  )
}
