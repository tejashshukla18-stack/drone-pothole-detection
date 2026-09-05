// Thin wrapper around the existing Express /api/notifications endpoints.
// Preserves the exact HTTP methods, URLs, and request/response shapes
// used by the legacy vanilla-JS frontend (see frontend/app.js -> fetchNotifications()).

async function parseJsonSafely(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/notifications
 * Returns { notifications: Notification[] }
 */
export async function fetchNotifications() {
  const res = await fetch('/api/notifications')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load notifications (${res.status})`)
  }
  return data?.notifications || []
}

/**
 * POST /api/notifications/mark-read
 * Marks ALL notifications as read (matches legacy behavior — the backend has
 * no per-notification read endpoint).
 * Returns { status: 'success' }
 */
export async function markAllNotificationsRead() {
  const res = await fetch('/api/notifications/mark-read', { method: 'POST' })
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to mark notifications as read.')
  }
  return data
}
