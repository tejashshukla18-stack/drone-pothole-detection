// Thin wrapper around the existing Express /api/dashboard endpoints.
// Preserves the exact HTTP methods, URLs, and response shapes used by the
// legacy vanilla-JS frontend (see frontend/app.js: fetchDashboardOverview).

async function parseJsonSafely(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/dashboard/overview
 * Returns { kpis, recent_activity, assets, recent_work_orders }
 */
export async function fetchDashboardOverview() {
  const res = await fetch('/api/dashboard/overview')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load dashboard overview (${res.status})`)
  }
  return data
}
