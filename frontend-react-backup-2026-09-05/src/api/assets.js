// Thin wrapper around the existing Express /api/assets endpoints.
// Preserves the exact HTTP methods, URLs, and request/response shapes
// used by the legacy vanilla-JS frontend (see frontend/app.js).

async function parseJsonSafely(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/assets
 * Returns { assets: Asset[] }
 */
export async function fetchAssets() {
  const res = await fetch('/api/assets')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load assets (${res.status})`)
  }
  return data?.assets || []
}

/**
 * GET /api/assets/:id
 * Returns { asset, inspections, reports, repairs }
 */
export async function fetchAssetDetail(assetId) {
  const res = await fetch(`/api/assets/${assetId}`)
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load asset (${res.status})`)
  }
  return data
}

/**
 * POST /api/assets
 * Body: { name, type, code, district, address, lat, lng, surface_type, length_km, assigned_engineer }
 * Returns { status: 'success', asset }
 */
export async function registerAsset(payload) {
  const res = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.asset) {
    throw new Error(data?.error || 'Failed to register asset. Please verify input fields.')
  }
  return data.asset
}
