// Synthetic demo GeoJSON for the Land Encroachment Intelligence map.
//
// IMPORTANT: Every polygon/line below is procedurally generated for product
// demonstration only. Shapes are approximate squares/strips sized from the
// synthetic parcel figures in `landIntelligenceData.js` and placed near
// (but not exactly at) real place names for visual plausibility. NONE of
// this is sourced from an official cadastral / land-records survey, and it
// must never be presented as such in the UI. See DATA_SOURCE_LABEL.

import { DATA_SOURCE_LABEL, PARCELS } from './landIntelligenceData.js'

export { DATA_SOURCE_LABEL }

const METERS_PER_DEG_LAT = 111320

function degLat(meters) {
  return meters / METERS_PER_DEG_LAT
}

function degLng(meters, atLat) {
  return meters / (METERS_PER_DEG_LAT * Math.cos((atLat * Math.PI) / 180))
}

// Builds an axis-aligned square polygon (GeoJSON ring, [lng, lat] order)
// centered at (lat, lng) with the given approximate area in square meters.
function squareRing(lat, lng, areaSqm) {
  const side = Math.sqrt(Math.max(areaSqm, 25))
  const half = side / 2
  const dLat = degLat(half)
  const dLng = degLng(half, lat)
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ]
}

// Offsets a lat/lng point by `meters` along `bearingDeg` (0 = north).
function offsetPoint(lat, lng, meters, bearingDeg) {
  const rad = (bearingDeg * Math.PI) / 180
  const dLat = degLat(meters * Math.cos(rad))
  const dLng = degLng(meters * Math.sin(rad), lat)
  return [lat + dLat, lng + dLng]
}

// ---------------------------------------------------------------------------
// 1. Cadastral Boundaries — one polygon per demo parcel, sized from its
//    authorized area. Full parcel record is carried in `properties` so the
//    map and the Parcel Detail Drawer share one source of truth.
// ---------------------------------------------------------------------------
export const CADASTRAL_PARCELS_GEOJSON = {
  type: 'FeatureCollection',
  features: PARCELS.map((p) => ({
    type: 'Feature',
    properties: { ...p, layer: 'cadastral' },
    geometry: {
      type: 'Polygon',
      coordinates: [squareRing(p.location.lat, p.location.lng, p.authorizedArea)],
    },
  })),
}

// ---------------------------------------------------------------------------
// 2. Detected Structures — drone-flagged building footprints within/around
//    each parcel, sized as a fraction of the drone-detected area.
// ---------------------------------------------------------------------------
export const DETECTED_STRUCTURES_GEOJSON = {
  type: 'FeatureCollection',
  features: PARCELS.map((p) => ({
    type: 'Feature',
    properties: {
      parcelId: p.parcelId,
      caseId: p.caseId,
      label: 'Detected Structure',
      layer: 'structure',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [squareRing(p.location.lat, p.location.lng, p.detectedArea * 0.32)],
    },
  })),
}

// ---------------------------------------------------------------------------
// 3. Potential Encroachment Zones — the "extra" area beyond the authorized
//    boundary, drawn as a small offset polygon touching the parcel edge.
// ---------------------------------------------------------------------------
export const ENCROACHMENT_ZONES_GEOJSON = {
  type: 'FeatureCollection',
  features: PARCELS.filter((p) => p.encroachmentArea > 0).map((p) => {
    const parcelSide = Math.sqrt(Math.max(p.authorizedArea, 25))
    const [oLat, oLng] = offsetPoint(p.location.lat, p.location.lng, parcelSide * 0.55, 45)
    return {
      type: 'Feature',
      properties: {
        parcelId: p.parcelId,
        caseId: p.caseId,
        riskLevel: p.riskLevel,
        status: p.status,
        encroachmentArea: p.encroachmentArea,
        encroachmentPercentage: p.encroachmentPercentage,
        encroachmentType: p.type,
        layer: 'encroachment',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [squareRing(oLat, oLng, p.encroachmentArea)],
      },
    }
  }),
}

// ---------------------------------------------------------------------------
// 4. Road ROW (Right of Way) — demo corridor centerlines. Rendered as thick
//    lines rather than buffered polygons for simplicity.
// ---------------------------------------------------------------------------
export const ROAD_ROW_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Demo Corridor — Bhopal to Indore (ROW)', layer: 'road' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [77.4126, 23.2469],
          [76.8756, 23.041],
          [75.7849, 23.1793],
          [75.6558, 22.6708],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Demo Corridor — Bhopal to Vidisha (ROW)', layer: 'road' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [77.4126, 23.2469],
          [77.7936, 23.3319],
          [77.9528, 23.7263],
          [77.8985, 24.214],
        ],
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// 5. Government Land — demo reserve blocks not tied to any encroachment case.
// ---------------------------------------------------------------------------
export const GOVERNMENT_LAND_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Sehore Govt. Reserve Block (Demo)', landType: 'Government', layer: 'government' },
      geometry: { type: 'Polygon', coordinates: [squareRing(23.05, 76.9, 40000)] },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Narmadapuram Forest Dept. Land (Demo)',
        landType: 'Government',
        layer: 'government',
      },
      geometry: { type: 'Polygon', coordinates: [squareRing(22.7, 77.72, 55000)] },
    },
  ],
}

// ---------------------------------------------------------------------------
// 6. Water Bodies — demo lakes/reservoirs.
// ---------------------------------------------------------------------------
export const WATER_BODIES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Barkheda Talab (Demo)', layer: 'water' },
      geometry: { type: 'Polygon', coordinates: [squareRing(23.335, 77.798, 60000)] },
    },
    {
      type: 'Feature',
      properties: { name: 'Lateri Reservoir (Demo)', layer: 'water' },
      geometry: { type: 'Polygon', coordinates: [squareRing(24.098, 77.7, 90000)] },
    },
  ],
}

// ---------------------------------------------------------------------------
// 7. Railway Corridor — demo rail centerline.
// ---------------------------------------------------------------------------
export const RAILWAY_CORRIDOR_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Demo Railway Corridor', layer: 'railway' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [77.3, 23.3],
          [77.5, 23.15],
          [77.75, 22.95],
          [77.9, 22.7],
        ],
      },
    },
  ],
}
