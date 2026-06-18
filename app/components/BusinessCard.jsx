'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const CONFIDENCE_LABEL = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
}

export default function BusinessCard({ business, userId }) {
  const [status, setStatus] = useState('idle')
  const [contacts, setContacts] = useState([])
  const [errorMsg, setErrorMsg] = useState(null)
  const [pagesChecked, setPagesChecked] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleFindContact() {
    setStatus('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/find-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, website: business.website }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Crawl failed')
        setStatus('error')
        return
      }
      setContacts(data.contacts || [])
      setPagesChecked(data.pagesChecked)
      setStatus('done')
    } catch {
      setErrorMsg('Network error during crawl')
      setStatus('error')
    }
  }

  async function handleSaveLead(email = null) {
    if (!userId || saving || saved) return
    setSaving(true)
    const { error } = await supabase.from('saved_leads').insert({
      user_id: userId,
      business_name: business.name,
      address: business.address || null,
      phone: business.phone || null,
      website: business.website || null,
      email: email || null,
      category: business.category || null,
    })
    if (!error) setSaved(true)
    setSaving(false)
  }

  return (
    <div className="bg-[var(--paper-card)] border border-[var(--line)] rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[var(--ink)] leading-tight">
            {business.name}
          </h3>
          {business.address && (
            <p className="text-sm text-[var(--ink-soft)] mt-1">{business.address}</p>
          )}
        </div>
        <button
          onClick={() => handleSaveLead()}
          disabled={saved || saving}
          className="shrink-0 text-xs font-mono border border-[var(--line)] rounded-full px-3 py-1 hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors disabled:opacity-40"
        >
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save lead'}
        </button>
      </div>

      <dl className="font-mono text-xs text-[var(--ink-soft)] grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {business.phone && (
          <>
            <dt className="uppercase tracking-wide">Phone</dt>
            <dd>{business.phone}</dd>
          </>
        )}
        {business.rating != null && (
          <>
            <dt className="uppercase tracking-wide">Rating</dt>
            <dd>
              {business.rating} ★
              {business.rating_count ? ` (${business.rating_count})` : ''}
            </dd>
          </>
        )}
        {business.website && (
          <>
            <dt className="uppercase tracking-wide">Site</dt>
            <dd className="truncate">
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--ink)]">
                {business.website.replace(/^https?:\/\//, '')}
              </a>
            </dd>
          </>
        )}
      </dl>

      <div className="mt-1 pt-3 border-t border-[var(--line)]">
        {!business.website && (
          <p className="text-xs text-[var(--ink-soft)] italic">
            No website on file — can&apos;t crawl for contacts.
          </p>
        )}

        {business.website && status === 'idle' && (
          <button
            onClick={handleFindContact}
            className="w-full bg-[var(--ink)] text-[var(--paper)] text-sm font-medium rounded-md px-4 py-2 hover:opacity-90 transition-opacity"
          >
            Find owner contact
          </button>
        )}

        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #e0e0e0', borderTop: '2px solid #5046e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>Crawling web…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--error)]">{errorMsg}</p>
            <button onClick={handleFindContact} className="text-xs underline text-[var(--ink-soft)]">Try again</button>
          </div>
        )}

        {status === 'done' && (
          <div>
            <button
              onClick={() => { setStatus('idle'); setContacts([]) }}
              style={{ fontSize: '12px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginBottom: '8px', padding: 0 }}
            >
              Hide results
            </button>

            {contacts.length === 0 && (
              <p className="text-sm text-[var(--ink-soft)]">
                No personal contact found
                {pagesChecked ? ` (checked ${pagesChecked} page${pagesChecked === 1 ? '' : 's'})` : ''}.
              </p>
            )}

            {contacts.length > 0 && (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.email} className="flex items-start justify-between gap-3 bg-[var(--found-bg)] rounded-md px-3 py-2">
                    <div>
                      {c.name && <p className="text-sm font-medium text-[var(--ink)]">{c.name}</p>}
                      <p className="font-mono text-sm text-[var(--found)]">{c.email}</p>
                      <a
                        href={`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(c.email)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', padding: '5px 10px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '11px', color: '#444', textDecoration: 'none', fontWeight: '500' }}
                      >
                        <img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png" width="14" height="14" alt="" />
                        Open in Gmail
                      </a>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider border border-[var(--found)] text-[var(--found)] rounded-full px-2 py-0.5">
                        {CONFIDENCE_LABEL[c.confidence] || c.confidence}
                      </span>
                      <button
                        onClick={() => handleSaveLead(c.email)}
                        disabled={saved || saving}
                        className="text-[10px] font-mono underline text-[var(--ink-soft)] disabled:opacity-40"
                      >
                        {saved ? '✓ Saved' : 'Save with email'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
