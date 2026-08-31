// Thin wrapper around the existing Express /api/maintenance endpoints.
// Preserves the exact HTTP methods, URLs, and request/response shapes
// used by the legacy vanilla-JS frontend (see frontend/app.js -> fetchMaintenance()).
// Work-order creation (POST /api/maintenance) already lives in api/inspections.js
// as createWorkOrder() and is reused as-is to avoid duplicate work-order logic.

async function parseJsonSafely(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/maintenance
 * Returns { work_orders: WorkOrder[] }
 */
export async function fetchMaintenance() {
  const res = await fetch('/api/maintenance')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load maintenance work orders (${res.status})`)
  }
  return data?.work_orders || []
}

/**
 * PUT /api/maintenance/:id
 * Body: { status?, progress_percent?, actual_cost? }
 * Returns WorkOrder
 */
export async function updateWorkOrder(id, payload) {
  const res = await fetch(`/api/maintenance/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.work_order) {
    throw new Error(data?.error || 'Failed to update work order.')
  }
  return data.work_order
}
