'use client'

import { useState } from 'react'

export default function SearchForm({ onSearch, loading }) {
  const [zip, setZip] = useState('')
  const [category, setCategory] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!zip.trim() || !category.trim()) return
    onSearch({ zip, category })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="zip" className="block text-xs font-mono uppercase tracking-widest text-[var(--ink-soft)] mb-1">
          Location
        </label>
        <input
          id="zip"
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Sandton, South Africa"
          className="w-full font-mono text-lg bg-[var(--paper-card)] border border-[var(--line)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/20"
          required
        />
      </div>

      <div className="flex-1">
        <label htmlFor="category" className="block text-xs font-mono uppercase tracking-widest text-[var(--ink-soft)] mb-1">
          Business type
        </label>
        <input
          id="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Plumbers, Dentists, Gyms..."
          className="w-full font-mono text-lg bg-[var(--paper-card)] border border-[var(--line)] rounded-md px-3 py-2 text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/20"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading || !zip.trim() || !category.trim()}
        className="bg-[var(--ink)] text-[var(--paper)] font-medium rounded-md px-6 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
