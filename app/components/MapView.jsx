'use client'

import { useEffect, useRef, useState } from 'react'
import BusinessCard from './BusinessCard'

export default function MapView({ businesses, userId }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [selectedBusiness, setSelectedBusiness] = useState(null)

  useEffect(() => {
    if (!businesses.length || mapInstanceRef.current) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = window.L
      const map = L.map(mapRef.current).setView([-26.1076, 28.0567], 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      const greenDot = (biz) => L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#22c55e;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
      })

      const geocodePromises = businesses.map(async (biz) => {
        if (!biz.address) return null
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(biz.address)}&format=json&limit=1`,
            { headers: { 'User-Agent': 'leadtrail/1.0' } }
          )
          const data = await res.json()
          if (data.length) {
            const lat = parseFloat(data[0].lat)
            const lon = parseFloat(data[0].lon)
            const marker = L.marker([lat, lon], { icon: greenDot(biz) }).addTo(map)
            
            marker.bindPopup(`
              <div style="font-family:sans-serif;min-width:180px;">
                <strong style="font-size:14px;">${biz.name}</strong>
                ${biz.address ? `<p style="font-size:12px;color:#666;margin:4px 0;">${biz.address}</p>` : ''}
                ${biz.phone ? `<p style="font-size:12px;color:#444;margin:4px 0;">📞 ${biz.phone}</p>` : ''}
                ${biz.rating ? `<p style="font-size:12px;color:#444;margin:4px 0;">⭐ ${biz.rating} (${biz.rating_count || 0})</p>` : ''}
                <button 
                  id="view-details-${biz.place_id}"
                  style="margin-top:8px;width:100%;padding:7px;background:#5046e5;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;"
                >
                  View Full Details
                </button>
              </div>
            `)

            marker.on('popupopen', () => {
              setTimeout(() => {
                const btn = document.getElementById(`view-details-${biz.place_id}`)
                if (btn) btn.onclick = () => setSelectedBusiness(biz)
              }, 100)
            })

            return [lat, lon]
          }
        } catch {}
        return null
      })

      Promise.all(geocodePromises).then((coords) => {
        const valid = coords.filter(Boolean)
        if (valid.length > 1) map.fitBounds(valid, { padding: [40, 40] })
        else if (valid.length === 1) map.setView(valid[0], 14)
      })
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [businesses])

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', marginTop: '24px' }} />

      {/* Business detail panel */}
      {selectedBusiness && (
        <div style={{
          position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh',
          backgroundColor: '#fff', borderLeft: '1px solid #eee',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
          zIndex: 1000, overflowY: 'auto', padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>Business Details</h3>
            <button
              onClick={() => setSelectedBusiness(null)}
              style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#999', lineHeight: 1 }}
            >×</button>
          </div>
          <BusinessCard business={selectedBusiness} userId={userId} />
        </div>
      )}

      {/* Overlay to close panel */}
      {selectedBusiness && (
        <div
          onClick={() => setSelectedBusiness(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: '380px', bottom: 0, zIndex: 999 }}
        />
      )}
    </div>
  )
}
