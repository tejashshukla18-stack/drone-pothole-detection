import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = [37.7749, -122.4194]
const DEFAULT_ZOOM = 12

export default function DefectHeatmap({ clusters }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const circlesRef = useRef([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    })
    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
      maxZoom: 18,
    }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      circlesRef.current = []
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    circlesRef.current.forEach((c) => c.remove())
    circlesRef.current = []

    const latLngs = []
    ;(clusters || []).forEach((h) => {
      if (!h.lat || !h.lng) return
      latLngs.push([h.lat, h.lng])
      const color = h.severity === 'High' ? '#ef4444' : '#f59e0b'
      const circle = L.circle([h.lat, h.lng], {
        color,
        fillColor: color,
        fillOpacity: 0.35,
        radius: 350,
      })
        .addTo(map)
        .bindPopup(`<strong>${h.name}</strong><br>${h.count} Cavities Detected`)
      circlesRef.current.push(circle)
    })

    if (latLngs.length > 1) {
      map.fitBounds(latLngs, { padding: [40, 40] })
    } else if (latLngs.length === 1) {
      map.setView(latLngs[0], 14)
    }
  }, [clusters])

  return <div ref={containerRef} className="h-[300px] w-full rounded-sm border border-border" />
}
