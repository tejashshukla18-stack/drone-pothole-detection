import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchMissions } from '../../api/inspections.js'
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL, healthScoreToColor, severityToColor } from '../../lib/mapTiles.js'

const DEFAULT_CENTER = [37.7749, -122.4194]
const NO_FLY_ZONES = [{ name: 'Airport Buffer — Class B', lat: 37.6213, lng: -122.3790, radius: 5000 }, { name: 'Heliport & Medical Center', lat: 37.7631, lng: -122.4580, radius: 800 }, { name: 'Municipal Critical Infrastructure', lat: 37.785, lng: -122.406, radius: 600 }]
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : null
const frameCoordinates = (item = {}) => {
  const source = item.gps_coordinates || item.telemetry || item.location || item
  const lat = num(source.lat ?? source.latitude), lng = num(source.lng ?? source.longitude)
  return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng, estimated: false } : null
}
function distance(a, b) { const r = (v) => v * Math.PI / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng); const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2; return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) }
function interpolate(route, count) {
  const segments = route.slice(1).map((point, i) => distance(route[i], point)), total = segments.reduce((sum, length) => sum + length, 0)
  return Array.from({ length: count }, (_, i) => { const wanted = count === 1 ? 0 : total * i / (count - 1); let covered = 0; for (let s = 0; s < segments.length; s += 1) { if (covered + segments[s] >= wanted) { const fraction = (wanted - covered) / segments[s]; return { lat: route[s].lat + (route[s + 1].lat - route[s].lat) * fraction, lng: route[s].lng + (route[s + 1].lng - route[s].lng) * fraction, estimated: true } } covered += segments[s] } return { ...route.at(-1), estimated: true } })
}
async function estimatePositions(count) {
  const start = { lat: 37.7749, lng: -122.4194 }, end = { lat: 37.7649, lng: -122.4294 }
  try { const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`); const payload = await response.json(); const route = payload.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => ({ lat, lng })); if (route?.length > 1) return interpolate(route, count) } catch { /* Deliberately use the visible estimated straight-line fallback. */ }
  return interpolate([start, end], count)
}

export default function DashboardMap({ assets, alertRadiusM = 200 }) {
  const containerRef = useRef(null), mapRef = useRef(null), assetLayersRef = useRef([]), missionLayersRef = useRef([]), timerRef = useRef(null), nfzRef = useRef(null)
  const [zonesVisible, setZonesVisible] = useState(true), [warning, setWarning] = useState(''), [message, setMessage] = useState('Loading latest mission locations…')
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: DEFAULT_CENTER, zoom: 12 })
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: TILE_MAX_ZOOM }).addTo(map)
    const zones = L.layerGroup().addTo(map)
    NO_FLY_ZONES.forEach((zone) => L.circle([zone.lat, zone.lng], { radius: zone.radius, color: '#ef4444', fillColor: '#ef4444', fillOpacity: .2, weight: 2, dashArray: '8 6' }).bindTooltip(`Restricted Airspace — ${zone.name}`, { sticky: true }).addTo(zones))
    mapRef.current = map; nfzRef.current = zones
    const refreshTiles = () => map.invalidateSize({ pan: false, debounceMoveend: true })
    const observer = new ResizeObserver(refreshTiles)
    observer.observe(containerRef.current)
    requestAnimationFrame(refreshTiles)
    setTimeout(refreshTiles, 200)
    return () => { observer.disconnect(); if (timerRef.current) clearInterval(timerRef.current); map.remove(); mapRef.current = null }
  }, [])
  useEffect(() => { const map = mapRef.current; if (!map) return; assetLayersRef.current.forEach((layer) => layer.remove()); assetLayersRef.current = []; const points = (assets || []).map((asset) => ({ asset, point: frameCoordinates(asset) })).filter(({ point }) => point); points.forEach(({ asset, point }) => { const color = healthScoreToColor(asset.health_score ?? 100); assetLayersRef.current.push(L.circleMarker([point.lat, point.lng], { radius: 10, fillColor: color, color: '#fff', weight: 2, fillOpacity: .85 }).addTo(map).bindPopup(`<strong>${asset.name}</strong><br>Health: ${asset.health_score ?? '—'}/100`)) }); setWarning(points.some(({ point }) => NO_FLY_ZONES.some((zone) => distance(point, zone) <= zone.radius + alertRadiusM)) ? `⚠️ RESTRICTED AIRSPACE: NO-FLY ZONE BREACH DETECTED — vehicle is within ${alertRadiusM}m of a restricted zone.` : '') }, [assets, alertRadiusM])
  useEffect(() => { const map = mapRef.current, zones = nfzRef.current; if (map && zones) zonesVisible ? zones.addTo(map) : map.removeLayer(zones) }, [zonesVisible])
  useEffect(() => { let cancelled = false; async function render() { try { const mission = (await fetchMissions()).at(-1), frames = Array.isArray(mission?.images) ? mission.images : []; if (!frames.length) return setMessage('No usable location data for this mission — it has no analyzed frames yet.'); const real = frames.map(frameCoordinates), estimated = await estimatePositions(frames.length), plotted = frames.map((frame, i) => ({ frame, point: real[i] || estimated[i] })).filter(({ point }) => point); if (!plotted.length || cancelled) return setMessage('No usable location data for this mission.'); setMessage(real.some(Boolean) ? '' : 'Frame locations are estimated from a road route; no frame GPS was supplied.'); if (timerRef.current) clearInterval(timerRef.current); missionLayersRef.current.forEach((layer) => layer.remove()); missionLayersRef.current = []; let i = 0, prior = null, priorSeverity = 'Low'; timerRef.current = setInterval(() => { if (i >= plotted.length) { clearInterval(timerRef.current); mapRef.current?.fitBounds(plotted.map(({ point }) => [point.lat, point.lng]), { padding: [40, 40] }); return } const { frame, point } = plotted[i], severity = frame.metrics?.severity || frame.severity || 'Low', color = severityToColor(severity), marker = L.circleMarker([point.lat, point.lng], { radius: 7, color, fillColor: color, fillOpacity: .9, weight: 2 }).addTo(mapRef.current).bindPopup(`<strong>Frame ${frame.frame_index ?? i + 1}</strong><br>Severity: ${severity}<br>${point.estimated ? '<b>Estimated position</b>' : 'Verified frame telemetry'}`); missionLayersRef.current.push(marker); const ranks = { Low: 1, Medium: 2, High: 3, 'P1 Critical': 4 }; if (prior) missionLayersRef.current.push(L.polyline([[prior.lat, prior.lng], [point.lat, point.lng]], { color: severityToColor((ranks[severity] || 1) >= (ranks[priorSeverity] || 1) ? severity : priorSeverity), weight: 4, opacity: .75 }).addTo(mapRef.current)); prior = point; priorSeverity = severity; i += 1 }, 250) } catch { if (!cancelled) setMessage('No usable location data for this mission.') } } render(); return () => { cancelled = true; if (timerRef.current) clearInterval(timerRef.current) } }, [])
  return (
    <div className="relative overflow-hidden rounded-sm border border-border bg-[#090c10]">
      {/* Tactical HUD Header Bar */}
      <div className="absolute left-3 top-3 z-[500] flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded border border-border/80 bg-[#0e121a]/90 px-2.5 py-1.5 font-mono text-[10.5px] text-slate-300 shadow-card-sm backdrop-blur-sm sm:flex">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
            <span className="text-text-muted">CTR:</span> 37.77°N, 122.41°W
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-text-muted">ALT:</span> 45m AGL
        </div>
      </div>

      <div className="absolute right-3 top-3 z-[500]">
        <button
          type="button"
          onClick={() => setZonesVisible((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-[#0e121a]/90 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-card-sm backdrop-blur-sm transition-colors hover:border-border-light hover:bg-[#151a24] hover:text-white"
        >
          <i className="fa-solid fa-ban text-p1" />
          {zonesVisible ? 'Hide' : 'Show'} No-Fly Zones
        </button>
      </div>

      {warning && (
        <div className="absolute bottom-3 left-3 right-3 z-[500] animate-pulse rounded-sm border border-p1/60 bg-p1/90 px-3 py-2 text-center text-xs font-extrabold text-white shadow-card-md backdrop-blur-sm">
          {warning}
        </div>
      )}

      {message && (
        <div className="absolute bottom-3 left-3 z-[500] rounded-sm border border-border/80 bg-[#0e121a]/90 px-3 py-1.5 font-mono text-[11px] font-medium text-slate-300 shadow-card-sm backdrop-blur-sm">
          <i className="fa-solid fa-circle-info mr-1.5 text-accent-blue" />
          {message}
        </div>
      )}

      <div ref={containerRef} className="h-[460px] w-full bg-[#090c10]" />
    </div>
  )
}
