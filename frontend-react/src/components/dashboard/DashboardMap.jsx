import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Mirrors frontend/app.js -> initDashboardMap(). Default centered around the
// municipal area used by the legacy app, then fit to registered asset markers.
const DEFAULT_CENTER = [37.7749, -122.4194]
const DEFAULT_ZOOM = 12
const NO_FLY_ZONES = [
  { name: 'Airport Buffer — Class B', lat: 37.6213, lng: -122.3790, radius: 5000 },
  { name: 'Heliport & Medical Center', lat: 37.7631, lng: -122.4580, radius: 800 },
  { name: 'Municipal Critical Infrastructure', lat: 37.785, lng: -122.406, radius: 600 },
]

function haversineMeters(first, second) {
  const radians = (value) => value * Math.PI / 180
  const dLat = radians(second.lat - first.lat)
  const dLng = radians(second.lng - first.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(first.lat)) * Math.cos(radians(second.lat)) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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

export default function DashboardMap({ assets, alertRadiusM = 200 }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const nfzRef = useRef(null)
  const [zonesVisible, setZonesVisible] = useState(true)
  const [warning, setWarning] = useState('')

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

    const zones = L.layerGroup().addTo(map)
    NO_FLY_ZONES.forEach((zone) => {
      L.circle([zone.lat, zone.lng], { radius: zone.radius, color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 2, dashArray: '8 6' })
        .bindTooltip(`Restricted Airspace — ${zone.name}`, { sticky: true }).addTo(zones)
    })
    nfzRef.current = zones

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = []
      nfzRef.current = null
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
      const lat = asset.location?.lat ?? asset.latitude
      const lng = asset.location?.lng ?? asset.longitude
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
    const breached = (assets || []).map((asset) => ({ lat: asset.location?.lat ?? asset.latitude, lng: asset.location?.lng ?? asset.longitude }))
      .find((point) => typeof point.lat === 'number' && typeof point.lng === 'number' && NO_FLY_ZONES.some((zone) => haversineMeters(point, zone) <= zone.radius + alertRadiusM))
    setWarning(breached ? `⚠️ RESTRICTED AIRSPACE: NO-FLY ZONE BREACH DETECTED — vehicle is within ${alertRadiusM}m of a restricted zone.` : '')
  }, [assets, alertRadiusM])

  useEffect(() => {
    const map = mapRef.current
    const zones = nfzRef.current
    if (!map || !zones) return
    if (zonesVisible) zones.addTo(map)
    else map.removeLayer(zones)
  }, [zonesVisible])

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-[500] flex gap-2">
        <button type="button" onClick={() => setZonesVisible((visible) => !visible)} aria-pressed={zonesVisible} className="rounded-sm border border-border bg-bg-card px-3 py-2 text-xs font-semibold text-text-primary shadow-card-sm hover:bg-bg-card-hover">
          <i className="fa-solid fa-ban mr-1.5 text-p1" />{zonesVisible ? 'Hide' : 'Show'} No-Fly Zones
        </button>
      </div>
      {warning && <div className="absolute bottom-3 left-3 right-3 z-[500] animate-pulse rounded-sm border border-p1 bg-p1 px-3 py-2 text-center text-xs font-extrabold text-white shadow-lg">{warning}</div>}
      <div ref={containerRef} className="h-[460px] w-full rounded-sm border border-border bg-slate-900" />
    </div>
  )
}
