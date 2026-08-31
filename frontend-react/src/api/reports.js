// Thin wrapper around the existing Express /api/reports endpoints.
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
 * GET /api/reports
 * Returns { reports: Report[] }
 */
export async function fetchReports() {
  const res = await fetch('/api/reports')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load reports (${res.status})`)
  }
  return data?.reports || []
}

/**
 * GET /api/reports/:id
 * Returns { report, asset, mission }
 */
export async function fetchReportDetail(id) {
  const res = await fetch(`/api/reports/${id}`)
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load report (${res.status})`)
  }
  return data
}

/**
 * POST /api/reports
 * Body: { mission_id?, asset_id?, inspector?, notes?, recommendations? }
 * Returns { status: 'success', report, asset }
 */
export async function generateReport(payload) {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.report) {
    throw new Error(data?.error || 'Failed to generate report.')
  }
  return data.report
}
