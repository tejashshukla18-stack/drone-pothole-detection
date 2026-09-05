import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILE_URL, severityToColor } from '../../lib/mapTiles.js'

const DEFAULT_CENTER = [37.7749, -122.4194]
function coordinates(order) {
  const source = order.location || order.asset_location || order.gps_coordinates || {}
  const lat = Number(source.lat ?? source.latitude), lng = Number(source.lng ?? source.longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

export default function CommandCentreMap({ workOrders }) {
  const ref = useRef(null), mapRef = useRef(null), layersRef = useRef([])
  useEffect(() => { if (!ref.current || mapRef.current) return; const map = L.map(ref.current, { center: DEFAULT_CENTER, zoom: 12 }); L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: TILE_MAX_ZOOM }).addTo(map); mapRef.current = map; return () => { map.remove(); mapRef.current = null } }, [])
  useEffect(() => { const map = mapRef.current; if (!map) return; layersRef.current.forEach((layer) => layer.remove()); const points = (workOrders || []).map((order) => ({ order, point: coordinates(order) })).filter(({ point }) => point); layersRef.current = points.map(({ order, point }) => { const color = severityToColor(order.priority); return L.circleMarker([point.lat, point.lng], { radius: 9, color, fillColor: color, fillOpacity: .85, weight: 2 }).addTo(map).bindPopup(`<strong>${order.asset_name || order.assetName || 'Municipal asset'}</strong><br>Priority: ${order.priority || '—'}<br>Status: ${order.status || '—'}`) }); if (points.length) map.fitBounds(points.map(({ point }) => [point.lat, point.lng]), { padding: [40, 40] }) }, [workOrders])
  return <div ref={ref} className="h-[300px] w-full rounded-sm border border-border" />
}
