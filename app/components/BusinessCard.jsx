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
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--ink)]"
              >
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
          <p className="text-sm text-[var(--pending)] font-mono animate-pulse">
            Crawling site…
          </p>
        )}

        {status === 'error' && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--error)]">{errorMsg}</p>
            <button onClick={handleFindContact} className="text-xs underline text-[var(--ink-soft)]">
              Try again
            </button>
          </div>
        )}

        {status === 'done' && contacts.length === 0 && (
          <p className="text-sm text-[var(--ink-soft)]">
            No personal contact found
            {pagesChecked ? ` (checked ${pagesChecked} page${pagesChecked === 1 ? '' : 's'})` : ''}.
          </p>
        )}

        {status === 'done' && contacts.length > 0 && (
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li
                key={c.email}
                className="flex items-start justify-between gap-3 bg-[var(--found-bg)] rounded-md px-3 py-2"
              >
                <div>
                  {c.name && <p className="text-sm font-medium text-[var(--ink)]">{c.name}</p>}
                  <p className="font-mono text-sm text-[var(--found)]">{c.email}</p>
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
    </div>
  )
}
