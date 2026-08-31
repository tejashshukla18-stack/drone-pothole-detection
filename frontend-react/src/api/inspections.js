// Thin wrapper around the existing Express inspection / AI review endpoints.
// Preserves the exact HTTP methods, URLs, and request/response shapes used
// by the legacy vanilla-JS frontend (see frontend/app.js + server.ts).

async function parseJsonSafely(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/missions
 * Returns Mission[]
 */
export async function fetchMissions() {
  const res = await fetch('/api/missions')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load missions (${res.status})`)
  }
  return data?.missions || []
}

/**
 * POST /api/missions
 * Body: { title, asset_id, drone_model, pilot_name, flight_altitude_m, weather?, notes? }
 * Returns Mission
 */
export async function createMission(payload) {
  const res = await fetch('/api/missions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.mission) {
    throw new Error(data?.error || 'Failed to initialize flight mission.')
  }
  return data.mission
}

/**
 * POST /api/inspect-sample
 * Body: { asset_id, filenames, sensitivity?, operating_threshold? }
 * Returns { results, mission, asset }
 */
export async function inspectSample({ assetId, filenames, sensitivity, operatingThreshold }) {
  const res = await fetch('/api/inspect-sample', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset_id: assetId,
      filenames,
      sensitivity,
      operating_threshold: operatingThreshold,
    }),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || data?.detail || 'Failed to analyze sample dataset.')
  }
  return data
}

/**
 * POST /api/inspect-batch (multipart)
 * Returns { results, mission, asset }
 */
export async function inspectBatch({ files, assetId, sensitivity, droneModel, pilotName }) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  if (assetId) formData.append('asset_id', assetId)
  if (sensitivity) formData.append('sensitivity', sensitivity)
  if (droneModel) formData.append('drone_model', droneModel)
  if (pilotName) formData.append('pilot_name', pilotName)

  const res = await fetch('/api/inspect-batch', {
    method: 'POST',
    body: formData,
  })
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || data?.detail || 'Failed to complete drone inspection batch.')
  }
  return data
}

/**
 * POST /api/inspect/reanalyze
 * Body: { image_id, filename, image_url, sensitivity, operating_threshold }
 * Returns { detection, bounding_boxes, metrics, ai_recommendation, benchmark_metrics, attention_peaks }
 */
export async function reanalyzeFrame({ imageId, filename, imageUrl, sensitivity, operatingThreshold }) {
  const res = await fetch('/api/inspect/reanalyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_id: imageId,
      filename,
      image_url: imageUrl,
      sensitivity,
      operating_threshold: operatingThreshold,
    }),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || 'Error during re-analysis.')
  }
  return data
}

/**
 * POST /api/reviews/verify (single frame human-in-the-loop sign-off)
 * Returns { message, image, asset }
 */
export async function verifyReview({ imageId, assetId, missionId, status, notes, boundingBoxes, inspectorName }) {
  const res = await fetch('/api/reviews/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_id: imageId,
      asset_id: assetId,
      mission_id: missionId,
      status,
      notes,
      bounding_boxes: boundingBoxes,
      inspector_name: inspectorName,
    }),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || 'Error verifying inspection frame.')
  }
  return data
}

/**
 * POST /api/reviews/verify-batch (whole mission sign-off)
 * Returns { message, mission, asset }
 */
export async function verifyBatchReview({ missionId, assetId, inspectorName, notes }) {
  const res = await fetch('/api/reviews/verify-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mission_id: missionId,
      asset_id: assetId,
      inspector_name: inspectorName,
      notes,
    }),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || 'Error approving mission batch.')
  }
  return data
}

/**
 * POST /api/reports
 * Returns { report, asset }
 */
export async function generateReport({ assetId, missionId, inspector, notes }) {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset_id: assetId, mission_id: missionId, inspector, notes }),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.report) {
    throw new Error(data?.error || 'Failed to generate report from review.')
  }
  return data.report
}

/**
 * POST /api/maintenance (dispatch work order)
 * Returns WorkOrder
 */
export async function createWorkOrder(payload) {
  const res = await fetch('/api/maintenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.work_order) {
    throw new Error(data?.error || 'Failed to dispatch work order.')
  }
  return data.work_order
}
