// Thin wrapper around the existing Express /api/settings endpoints.
// Preserves the exact HTTP methods, URLs, and request/response shapes
// used by the legacy vanilla-JS frontend (see frontend/app.js -> initSettingsForm()).

async function parseJsonSafely(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/settings
 * Returns { settings, users: User[] }
 */
export async function fetchSettings() {
  const res = await fetch('/api/settings')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load settings (${res.status})`)
  }
  return data || { settings: {}, users: [] }
}

/**
 * POST /api/settings
 * Body: department settings fields (merged server-side via Object.assign)
 * Returns { status: 'success', settings }
 */
export async function saveSettings(payload) {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.settings) {
    throw new Error(data?.error || 'Failed to save settings.')
  }
  return data.settings
}
