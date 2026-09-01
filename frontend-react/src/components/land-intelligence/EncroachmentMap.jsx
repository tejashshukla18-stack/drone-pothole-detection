import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import EmptyState from '../ui/EmptyState.jsx'
import FormField from '../ui/FormField.jsx'
import {
  DISTRICTS,
  ENCROACHMENT_TYPES,
  LAND_TYPES,
  RISK_LEVELS,
  STATUSES,
  TEHSILS,
  VILLAGES,
} from '../../data/landIntelligenceData.js'
import {
  CADASTRAL_PARCELS_GEOJSON,
  DATA_SOURCE_LABEL,
  DETECTED_STRUCTURES_GEOJSON,
  ENCROACHMENT_ZONES_GEOJSON,
  GOVERNMENT_LAND_GEOJSON,
  RAILWAY_CORRIDOR_GEOJSON,
  ROAD_ROW_GEOJSON,
  WATER_BODIES_GEOJSON,
} from '../../data/landGeoJson.js'
import { getDisplayRiskLevel, isVerified, MAP_LEGEND_COLORS } from './landIntelligenceHelpers.js'

const DEFAULT_CENTER = [23.2, 77.5] // Central Madhya Pradesh
const DEFAULT_ZOOM = 7

const EMPTY_FILTERS = {
  parcelId: '',
  surveyNumber: '',
  district: 'all',
  tehsil: 'all',
  village: 'all',
  landType: 'all',
  risk: 'all',
  encroachmentType: 'all',
  status: 'all',
}

const LAYER_TOGGLES = [
  { id: 'cadastral', label: 'Cadastral Boundaries', icon: 'fa-draw-polygon', defaultOn: true },
  { id: 'structures', label: 'Detected Structures', icon: 'fa-building', defaultOn: true },
  { id: 'encroachment', label: 'Potential Encroachment Zones', icon: 'fa-triangle-exclamation', defaultOn: true },
  { id: 'road', label: 'Road ROW', icon: 'fa-road', defaultOn: false },
  { id: 'government', label: 'Government Land', icon: 'fa-landmark', defaultOn: false },
  { id: 'water', label: 'Water Bodies', icon: 'fa-water', defaultOn: false },
  { id: 'railway', label: 'Railway Corridor', icon: 'fa-train', defaultOn: false },
]

const LEGEND_ITEMS = [
  { label: 'Clear', color: MAP_LEGEND_COLORS.CLEAR },
  { label: 'Low Risk', color: MAP_LEGEND_COLORS.LOW },
  { label: 'Medium Risk', color: MAP_LEGEND_COLORS.MEDIUM },
  { label: 'High Risk', color: MAP_LEGEND_COLORS.HIGH },
  { label: 'Verified', color: MAP_LEGEND_COLORS.VERIFIED },
]

function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str ?? ''
  return div.innerHTML
}

function riskColor(parcel) {
  return MAP_LEGEND_COLORS[getDisplayRiskLevel(parcel)] || MAP_LEGEND_COLORS.LOW
}

export default function EncroachmentMap({ parcels, onSelectParcel }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerGroupsRef = useRef({})

  const [layersOn, setLayersOn] = useState(() =>
    Object.fromEntries(LAYER_TOGGLES.map((l) => [l.id, l.defaultOn])),
  )

  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)

  const filteredParcels = useMemo(() => {
    const parcelIdQuery = appliedFilters.parcelId.trim().toLowerCase()
    const surveyQuery = appliedFilters.surveyNumber.trim().toLowerCase()

    return (parcels || []).filter((p) => {
      if (parcelIdQuery && !p.parcelId.toLowerCase().includes(parcelIdQuery)) return false
      if (surveyQuery && !p.surveyNumber.toLowerCase().includes(surveyQuery)) return false
      if (appliedFilters.district !== 'all' && p.district !== appliedFilters.district) return false
      if (appliedFilters.tehsil !== 'all' && p.tehsil !== appliedFilters.tehsil) return false
      if (appliedFilters.village !== 'all' && p.village !== appliedFilters.village) return false
      if (appliedFilters.landType !== 'all' && p.landType !== appliedFilters.landType) return false
      if (appliedFilters.risk !== 'all' && p.riskLevel !== appliedFilters.risk) return false
      if (appliedFilters.encroachmentType !== 'all' && p.type !== appliedFilters.encroachmentType)
        return false
      if (appliedFilters.status !== 'all' && p.status !== appliedFilters.status) return false
      return true
    })
  }, [parcels, appliedFilters])

  const visibleParcelIds = useMemo(
    () => new Set(filteredParcels.map((p) => p.parcelId)),
    [filteredParcels],
  )

  // Look up the canonical full parcel record so the drawer always gets a
  // complete object, whether the click originated on a cadastral polygon,
  // a structure footprint, or an encroachment zone.
  const parcelsById = useMemo(() => {
    const map = new Map()
    ;(parcels || []).forEach((p) => map.set(p.parcelId, p))
    return map
  }, [parcels])

  // Initialize the map once.
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
      layerGroupsRef.current = {}
    }
  }, [])

  // Rebuild every layer whenever the filtered parcel set changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    Object.values(layerGroupsRef.current).forEach((group) => group.remove())
    layerGroupsRef.current = {}

    function selectByParcelId(parcelId) {
      const parcel = parcelsById.get(parcelId)
      if (parcel) onSelectParcel?.(parcel)
    }

    // --- Cadastral Boundaries -------------------------------------------
    const cadastralFeatures = CADASTRAL_PARCELS_GEOJSON.features.filter((f) =>
      visibleParcelIds.has(f.properties.parcelId),
    )
    const cadastralLayer = L.geoJSON(
      { type: 'FeatureCollection', features: cadastralFeatures },
      {
        style: (feature) => {
          const p = feature.properties
          const verified = isVerified(p)
          return {
            color: verified ? MAP_LEGEND_COLORS.VERIFIED : riskColor(p),
            weight: verified ? 3 : 2,
            fillColor: riskColor(p),
            fillOpacity: 0.28,
          }
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties
          layer.bindPopup(`
            <div style="font-family: sans-serif; font-size: 13px; color: #1e293b; min-width: 210px;">
              <strong style="color: #0f172a; font-size: 14px;">${escapeHtml(p.parcelId)}</strong> · Survey ${escapeHtml(p.surveyNumber)}<br>
              <span style="color: #64748b;">${escapeHtml(p.village)}, ${escapeHtml(p.tehsil)} &bull; ${escapeHtml(p.district)}</span><br>
              <span style="color: #64748b;">${escapeHtml(p.landType)} &bull; ${escapeHtml(p.status)}</span><br>
              <div style="margin-top: 6px; padding: 4px 8px; border-radius: 4px; background: ${riskColor(p)}; color: #fff; font-weight: bold; font-size: 11px; display: inline-block;">
                ${escapeHtml(getDisplayRiskLevel(p))} &bull; ${p.encroachmentPercentage}% over authorized area
              </div>
            </div>
          `)
          layer.on('click', () => selectByParcelId(p.parcelId))
        },
      },
    )
    layerGroupsRef.current.cadastral = cadastralLayer
    if (layersOn.cadastral) cadastralLayer.addTo(map)

    // --- Detected Structures ---------------------------------------------
    const structureFeatures = DETECTED_STRUCTURES_GEOJSON.features.filter((f) =>
      visibleParcelIds.has(f.properties.parcelId),
    )
    const structuresLayer = L.geoJSON(
      { type: 'FeatureCollection', features: structureFeatures },
      {
        style: { color: '#334155', weight: 1.5, fillColor: '#475569', fillOpacity: 0.55 },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(
            `<div style="font-family: sans-serif; font-size: 12px;"><strong>Detected Structure</strong><br>Parcel: ${escapeHtml(
              feature.properties.parcelId,
            )}</div>`,
          )
          layer.on('click', () => selectByParcelId(feature.properties.parcelId))
        },
      },
    )
    layerGroupsRef.current.structures = structuresLayer
    if (layersOn.structures) structuresLayer.addTo(map)

    // --- Potential Encroachment Zones -------------------------------------
    const zoneFeatures = ENCROACHMENT_ZONES_GEOJSON.features.filter((f) =>
      visibleParcelIds.has(f.properties.parcelId),
    )
    const encroachmentLayer = L.geoJSON(
      { type: 'FeatureCollection', features: zoneFeatures },
      {
        style: (feature) => ({
          color: MAP_LEGEND_COLORS.HIGH,
          weight: 1.5,
          fillColor: MAP_LEGEND_COLORS.HIGH,
          fillOpacity: 0.45,
          dashArray: '4 3',
        }),
        onEachFeature: (feature, layer) => {
          const p = feature.properties
          layer.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; min-width: 180px;">
              <strong>Potential Encroachment</strong><br>
              Parcel: ${escapeHtml(p.parcelId)}<br>
              ${escapeHtml(p.encroachmentType)}<br>
              ${p.encroachmentArea.toLocaleString('en-IN')} m² (${p.encroachmentPercentage}%)
            </div>
          `)
          layer.on('click', () => selectByParcelId(p.parcelId))
        },
      },
    )
    layerGroupsRef.current.encroachment = encroachmentLayer
    if (layersOn.encroachment) encroachmentLayer.addTo(map)

    // --- Road ROW -----------------------------------------------------------
    const roadLayer = L.geoJSON(ROAD_ROW_GEOJSON, {
      style: { color: '#64748b', weight: 4, opacity: 0.7, dashArray: '2 6' },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<div style="font-family: sans-serif; font-size: 12px;">${escapeHtml(feature.properties.name)}</div>`)
      },
    })
    layerGroupsRef.current.road = roadLayer
    if (layersOn.road) roadLayer.addTo(map)

    // --- Government Land ------------------------------------------------
    const governmentLayer = L.geoJSON(GOVERNMENT_LAND_GEOJSON, {
      style: { color: '#4f46e5', weight: 1.5, fillColor: '#4f46e5', fillOpacity: 0.15 },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<div style="font-family: sans-serif; font-size: 12px;">${escapeHtml(feature.properties.name)}</div>`)
      },
    })
    layerGroupsRef.current.government = governmentLayer
    if (layersOn.government) governmentLayer.addTo(map)

    // --- Water Bodies -----------------------------------------------------
    const waterLayer = L.geoJSON(WATER_BODIES_GEOJSON, {
      style: { color: '#0284c7', weight: 1.5, fillColor: '#38bdf8', fillOpacity: 0.35 },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<div style="font-family: sans-serif; font-size: 12px;">${escapeHtml(feature.properties.name)}</div>`)
      },
    })
    layerGroupsRef.current.water = waterLayer
    if (layersOn.water) waterLayer.addTo(map)

    // --- Railway Corridor -------------------------------------------------
    const railwayLayer = L.geoJSON(RAILWAY_CORRIDOR_GEOJSON, {
      style: { color: '#0f172a', weight: 2.5, dashArray: '1 6' },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<div style="font-family: sans-serif; font-size: 12px;">${escapeHtml(feature.properties.name)}</div>`)
      },
    })
    layerGroupsRef.current.railway = railwayLayer
    if (layersOn.railway) railwayLayer.addTo(map)

    // Fit bounds to the currently filtered cadastral parcels (falls back to
    // the default MP view if the filter matches nothing).
    if (cadastralFeatures.length > 0) {
      const bounds = cadastralLayer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleParcelIds, parcelsById])

  // Toggle layer visibility without rebuilding the geometry.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    LAYER_TOGGLES.forEach(({ id }) => {
      const layer = layerGroupsRef.current[id]
      if (!layer) return
      const shouldShow = layersOn[id]
      const isShown = map.hasLayer(layer)
      if (shouldShow && !isShown) layer.addTo(map)
      if (!shouldShow && isShown) layer.remove()
    })
  }, [layersOn])

  function toggleLayer(id) {
    setLayersOn((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function updateDraft(key, value) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleApplyFilters() {
    setAppliedFilters(draftFilters)
  }

  function handleReset() {
    setDraftFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  if (!parcels || parcels.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-map"
        title="No Parcel Locations Available"
        message="Encroachment case locations will appear here once parcel analysis data is available."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border-light bg-bg-input px-4 py-2.5">
        <span className="inline-flex items-center gap-2 rounded-full bg-p2/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-p2">
          <i className="fa-solid fa-flask" /> {DATA_SOURCE_LABEL}
        </span>
        <p className="text-[11px] text-text-muted">
          Boundaries and layers shown are procedurally generated demo shapes for product
          demonstration only — not official cadastral survey data.
        </p>
      </div>

      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-text-primary">
          <i className="fa-solid fa-filter text-accent-blue" /> Map Filters
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FormField
            label="Search Parcel ID"
            placeholder="e.g. PCL-10231"
            value={draftFilters.parcelId}
            onChange={(e) => updateDraft('parcelId', e.target.value)}
          />
          <FormField
            label="Search Survey Number"
            placeholder="e.g. 142/3"
            value={draftFilters.surveyNumber}
            onChange={(e) => updateDraft('surveyNumber', e.target.value)}
          />
          <FormField
            label="District"
            as="select"
            value={draftFilters.district}
            onChange={(e) => updateDraft('district', e.target.value)}
            options={[{ value: 'all', label: 'All Districts' }, ...DISTRICTS.map((d) => ({ value: d, label: d }))]}
          />
          <FormField
            label="Tehsil"
            as="select"
            value={draftFilters.tehsil}
            onChange={(e) => updateDraft('tehsil', e.target.value)}
            options={[{ value: 'all', label: 'All Tehsils' }, ...TEHSILS.map((t) => ({ value: t, label: t }))]}
          />
          <FormField
            label="Village"
            as="select"
            value={draftFilters.village}
            onChange={(e) => updateDraft('village', e.target.value)}
            options={[{ value: 'all', label: 'All Villages' }, ...VILLAGES.map((v) => ({ value: v, label: v }))]}
          />
          <FormField
            label="Land Type"
            as="select"
            value={draftFilters.landType}
            onChange={(e) => updateDraft('landType', e.target.value)}
            options={[{ value: 'all', label: 'All Land Types' }, ...LAND_TYPES.map((t) => ({ value: t, label: t }))]}
          />
          <FormField
            label="Risk"
            as="select"
            value={draftFilters.risk}
            onChange={(e) => updateDraft('risk', e.target.value)}
            options={[{ value: 'all', label: 'All Risk Levels' }, ...RISK_LEVELS.map((r) => ({ value: r, label: r }))]}
          />
          <FormField
            label="Encroachment Type"
            as="select"
            value={draftFilters.encroachmentType}
            onChange={(e) => updateDraft('encroachmentType', e.target.value)}
            options={[
              { value: 'all', label: 'All Encroachment Types' },
              ...ENCROACHMENT_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />
          <FormField
            label="Status"
            as="select"
            value={draftFilters.status}
            onChange={(e) => updateDraft('status', e.target.value)}
            options={[{ value: 'all', label: 'All Statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-text-muted">
            {filteredParcels.length} of {parcels.length} demo parcels matching current filters
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-sm border border-border bg-bg-card px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-sm bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-blue-hover"
            >
              <i className="fa-solid fa-check mr-1.5" /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
              <i className="fa-solid fa-map-location-dot text-accent-blue" /> Encroachment Map
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Georeferenced parcel boundaries and detection layers, color-coded by risk level
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {LAYER_TOGGLES.map((layer) => (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  layersOn[layer.id]
                    ? 'border-border-light bg-bg-card-hover text-text-primary'
                    : 'border-border bg-transparent text-text-muted opacity-60'
                }`}
              >
                <i className={`fa-solid ${layer.icon}`} />
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={containerRef} className="h-[560px] w-full rounded-sm border border-border bg-slate-900" />

        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Legend</span>
          {LEGEND_ITEMS.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white/40"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>

        <p className="mt-3 text-[11px] text-text-muted">
          <i className="fa-solid fa-circle-info mr-1" /> Click a parcel, structure, or encroachment
          zone to open the full parcel record. All boundaries shown are synthetic demo data.
        </p>
      </div>
    </div>
  )
}
