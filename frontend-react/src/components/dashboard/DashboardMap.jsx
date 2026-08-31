import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Mirrors frontend/app.js -> initDashboardMap(). Default centered around the
// municipal area used by the legacy app, then fit to registered asset markers.
const DEFAULT_CENTER = [37.7749, -122.4194]
const DEFAULT_ZOOM = 12

function severityColor(healthScore) {
  if (healthScore < 70) return '#ef4444'
  if (healthScore < 85) return '#f59e0b'
  return '#10b981'
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str ?? ''
  return div.innerHTML
}

export default function DashboardMap({ assets }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  // Initialize the map once on mount, tear it down on unmount. This avoids
  // creating duplicate Leaflet instances across React re-renders.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })
    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap & CartoDB',
      maxZoom: 19,
    }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = []
    }
  }, [])

  // Sync markers whenever the asset list changes, without re-creating the map.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    const latLngs = []
    ;(assets || []).forEach((asset) => {
      const lat = asset.location?.lat
      const lng = asset.location?.lng
      if (typeof lat !== 'number' || typeof lng !== 'number') return

      latLngs.push([lat, lng])
      const color = severityColor(asset.health_score ?? 100)
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map)

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #1e293b;">
          <strong style="color: #0f172a; font-size: 14px;">${escapeHtml(asset.name)}</strong><br>
          <span style="color: #64748b;">Code: ${escapeHtml(asset.code)} &bull; ${escapeHtml(asset.district)}</span><br>
          <div style="margin-top: 6px; padding: 4px 8px; border-radius: 4px; background: ${color}; color: #fff; font-weight: bold; font-size: 11px; display: inline-block;">
            Health: ${asset.health_score}/100 &bull; ${asset.total_defects ?? 0} Defects
          </div>
        </div>
      `)

      markersRef.current.push(marker)
    })

    if (latLngs.length > 1) {
      map.fitBounds(latLngs, { padding: [40, 40] })
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 14)
    }
  }, [assets])

  return <div ref={containerRef} className="h-[460px] w-full rounded-sm border border-border bg-slate-900" />
}
