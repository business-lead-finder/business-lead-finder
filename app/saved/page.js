'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function SavedLeads() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading])

  useEffect(() => {
    if (user) fetchLeads()
  }, [user])

  async function fetchLeads() {
    setLoadingLeads(true)
    const { data, error } = await supabase
      .from('saved_leads')
      .select('*')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false })
    if (!error) setLeads(data || [])
    setLoadingLeads(false)
  }

  async function removeLead(id) {
    await supabase.from('saved_leads').delete().eq('id', id)
    setLeads(leads.filter(l => l.id !== id))
  }

  if (loading) return null

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)] mb-2">
              Lead finder
            </p>
            <h1 className="font-serif text-3xl font-bold">Saved Leads</h1>
            <p className="text-[var(--ink-soft)] mt-1 text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/')} className="text-sm underline text-[var(--ink-soft)]">
              Search
            </button>
            <button onClick={signOut} className="text-sm underline text-[var(--ink-soft)]">
              Sign out
            </button>
          </div>
        </header>

        {loadingLeads ? (
          <p className="text-[var(--ink-soft)] font-mono animate-pulse">Loading leads…</p>
        ) : leads.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--ink-soft)]">No saved leads yet.</p>
            <button onClick={() => router.push('/')} className="mt-4 underline text-sm text-[var(--ink)]">
              Start searching
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {leads.map((lead) => (
              <div key={lead.id} className="bg-[var(--paper-card)] border border-[var(--line)] rounded-lg p-5">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-serif text-lg font-semibold">{lead.business_name}</h3>
                  <button
                    onClick={() => removeLead(lead.id)}
                    className="text-xs text-[var(--ink-soft)] hover:text-[var(--error)] transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
                {lead.address && <p className="text-sm text-[var(--ink-soft)] mt-1">{lead.address}</p>}
                <dl className="font-mono text-xs text-[var(--ink-soft)] grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mt-3">
                  {lead.phone && <><dt className="uppercase tracking-wide">Phone</dt><dd>{lead.phone}</dd></>}
                  {lead.email && <><dt className="uppercase tracking-wide">Email</dt><dd className="text-[var(--found)]">{lead.email}</dd></>}
                  {lead.website && <><dt className="uppercase tracking-wide">Site</dt><dd className="truncate"><a href={lead.website} target="_blank" rel="noopener noreferrer" className="underline">{lead.website.replace(/^https?:\/\//, '')}</a></dd></>}
                </dl>
                {lead.category && (
                  <span className="mt-3 inline-block text-[10px] font-mono uppercase tracking-wider border border-[var(--line)] rounded-full px-2 py-0.5 text-[var(--ink-soft)]">
                    {lead.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
