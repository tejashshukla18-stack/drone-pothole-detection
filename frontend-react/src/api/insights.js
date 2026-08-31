// Thin wrapper around the existing Express /api/insights endpoint.
// Preserves the exact response shape used by the legacy vanilla-JS frontend
// (see frontend/app.js -> fetchInsights() / renderInsightsCharts()).

async function parseJsonSafely(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/insights
 * Returns {
 *   health_score, severity_distribution, inspection_trends,
 *   asset_type_distribution, repair_progress, gis_defect_clusters
 * }
 */
export async function fetchInsights() {
  const res = await fetch('/api/insights')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load insights (${res.status})`)
  }
  return data || {}
}
