'use client'

import { useEffect, useRef } from 'react'

export default function MapView({ businesses }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!businesses.length || mapInstanceRef.current) return

    // Dynamically load Leaflet
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = window.L

      // Geocode businesses that have addresses using their coordinates from Google
      // Use first business as center, fallback to Johannesburg
      const firstBiz = businesses[0]
      const center = [-26.1076, 28.0567] // Johannesburg default

      const map = L.map(mapRef.current).setView(center, 13)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Custom green dot icon
      const greenDot = L.divIcon({
        className: '',
        html: `<div style="
          width: 14px; height: 14px;
          background: #22c55e;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
      })

      // Geocode each business address and add markers
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
            const marker = L.marker([lat, lon], { icon: greenDot }).addTo(map)
            marker.bindPopup(`
              <div style="font-family: sans-serif; min-width: 160px;">
                <strong style="font-size: 14px;">${biz.name}</strong>
                ${biz.address ? `<p style="font-size: 12px; color: #666; margin: 4px 0 0;">${biz.address}</p>` : ''}
                ${biz.phone ? `<p style="font-size: 12px; color: #444; margin: 4px 0 0;">📞 ${biz.phone}</p>` : ''}
              </div>
            `)
            return [lat, lon]
          }
        } catch {}
        return null
      })

      // Fit map to all markers once geocoded
      Promise.all(geocodePromises).then((coords) => {
        const valid = coords.filter(Boolean)
        if (valid.length > 1) {
          map.fitBounds(valid, { padding: [40, 40] })
        } else if (valid.length === 1) {
          map.setView(valid[0], 14)
        }
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
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '500px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #eee',
        marginTop: '24px',
      }}
    />
  )
}
