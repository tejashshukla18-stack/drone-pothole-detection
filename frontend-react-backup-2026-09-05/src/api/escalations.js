// Thin wrapper around the new Express Issue Escalation endpoints.
// Follows the same shape/error-handling convention as the other
// frontend-react/src/api/*.js modules (see api/assets.js, api/inspections.js).

async function parseJsonSafely(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * GET /api/escalations
 * Returns { escalations: EscalationTicket[], kpis: {...} }
 */
export async function fetchEscalations() {
  const res = await fetch('/api/escalations')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load escalated issues (${res.status})`)
  }
  return {
    escalations: data?.escalations || [],
    kpis: data?.kpis || {
      critical_issues: 0,
      high_priority: 0,
      open_tickets: 0,
      resolved: 0,
      awaiting_response: 0,
      in_progress: 0,
      overdue: 0,
    },
  }
}

/**
 * GET /api/escalations/:id
 * Returns { escalation: EscalationTicket }
 */
export async function fetchEscalationDetail(ticketId) {
  const res = await fetch(`/api/escalations/${ticketId}`)
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.escalation) {
    throw new Error(data?.error || 'Failed to load ticket detail.')
  }
  return data.escalation
}

/**
 * POST /api/escalations/auto-generate
 * Body: { mission_id, asset_id?, image_id? }
 * Explicitly (re)runs the escalation pipeline for a mission/image.
 * Duplicate-safe: already-ticketed detections are returned, not re-created.
 */
export async function autoGenerateEscalations(payload) {
  const res = await fetch('/api/escalations/auto-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to run the escalation pipeline.')
  }
  return data
}

/**
 * GET /api/authorities
 * Returns Authority[]
 */
export async function fetchAuthorities() {
  const res = await fetch('/api/authorities')
  const data = await parseJsonSafely(res)
  if (!res.ok) {
    throw new Error(data?.error || `Failed to load the authority directory (${res.status})`)
  }
  return data?.authorities || []
}

// --- Part 2: ticket workflow actions -------------------------------------
// Every action below returns { status: 'success', escalation: EscalationTicket }
// (or additionally `work_order` for link-work-order) and follows the same
// fetch/parseJsonSafely/throw convention as the rest of this file.

async function postTicketAction(ticketId, action, payload) {
  const res = await fetch(`/api/escalations/${ticketId}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  })
  const data = await parseJsonSafely(res)
  if (!res.ok || !data?.escalation) {
    throw new Error(data?.error || `Failed to ${action.replace(/-/g, ' ')} the ticket.`)
  }
  return data
}

/** POST /api/escalations/:id/notify/retry */
export async function retryNotification(ticketId) {
  const data = await postTicketAction(ticketId, 'notify/retry')
  return data.escalation
}

/** POST /api/escalations/:id/acknowledge */
export async function acknowledgeTicket(ticketId) {
  const data = await postTicketAction(ticketId, 'acknowledge')
  return data.escalation
}

/** POST /api/escalations/:id/escalate */
export async function escalateTicket(ticketId) {
  const data = await postTicketAction(ticketId, 'escalate')
  return data.escalation
}

/** POST /api/escalations/:id/link-work-order  Body: { work_order_id } */
export async function linkWorkOrder(ticketId, workOrderId) {
  return postTicketAction(ticketId, 'link-work-order', { work_order_id: workOrderId })
}

/** POST /api/escalations/:id/resolve  Body: { after_repair_image_url? } */
export async function resolveTicket(ticketId, afterRepairImageUrl) {
  const data = await postTicketAction(ticketId, 'resolve', { after_repair_image_url: afterRepairImageUrl })
  return data.escalation
}

/** POST /api/escalations/:id/verify  Body: { resolved: boolean, verified_by? } */
export async function verifyTicket(ticketId, resolved, verifiedBy) {
  const data = await postTicketAction(ticketId, 'verify', { resolved, verified_by: verifiedBy })
  return data.escalation
}

/** POST /api/escalations/:id/close */
export async function closeTicket(ticketId) {
  const data = await postTicketAction(ticketId, 'close')
  return data.escalation
}
