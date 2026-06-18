'use client'

import { useState } from 'react'
import BusinessCard from './BusinessCard'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('./MapView'), { ssr: false })

export default function BusinessList({ businesses, userId }) {
  const [view, setView] = useState('list')

  if (!businesses.length) return null

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setView('list')}
          style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: view === 'list' ? '#5046e5' : '#fff', color: view === 'list' ? '#fff' : '#555', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
        >
          ☰ List
        </button>
        <button
          onClick={() => setView('map')}
          style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: view === 'map' ? '#5046e5' : '#fff', color: view === 'map' ? '#fff' : '#555', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
        >
          🗺️ Map
        </button>
        <span style={{ fontSize: '13px', color: '#999', alignSelf: 'center', marginLeft: '4px' }}>
          {businesses.length} results
        </span>
      </div>

      {view === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {businesses.map((b) => (
            <BusinessCard key={b.place_id} business={b} userId={userId} />
          ))}
        </div>
      )}

      {view === 'map' && <MapView businesses={businesses} userId={userId} />}
    </div>
  )
}
