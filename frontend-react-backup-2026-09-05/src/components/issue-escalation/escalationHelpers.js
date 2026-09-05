// Shared helpers for translating escalation ticket data into consistent
// Tailwind classes and display strings across the Issue Escalation page.
// Mirrors the pattern used in components/inspections/inspectionHelpers.js.

export const SEVERITY_BADGE_CLASSES = {
  Critical: 'bg-p1/20 text-p1',
  High: 'bg-p1/15 text-p1',
  Medium: 'bg-p2/15 text-p2',
  Low: 'bg-p3/15 text-p3',
}

export const STATUS_BADGE_CLASSES = {
  AUTO_GENERATED: 'bg-accent-blue/15 text-accent-blue',
  NOTIFIED: 'bg-accent-blue/15 text-accent-blue',
  ACKNOWLEDGED: 'bg-p2/15 text-p2',
  IN_PROGRESS: 'bg-accent-teal/15 text-accent-teal',
  RESOLVED: 'bg-p3/15 text-p3',
  VERIFICATION_REQUIRED: 'bg-p2/15 text-p2',
  CLOSED: 'bg-border text-text-secondary',
  ESCALATED: 'bg-p1/15 text-p1',
  REOPENED: 'bg-p1/15 text-p1',
}

// Ordered lifecycle used for the ticket-detail stepper.
export const LIFECYCLE_STEPS = [
  'AUTO_GENERATED',
  'NOTIFIED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFICATION_REQUIRED',
  'CLOSED',
]

export function lifecycleIndex(status) {
  if (status === 'ESCALATED' || status === 'REOPENED') return -1
  return LIFECYCLE_STEPS.indexOf(status)
}

export function getSeverityTone(severity) {
  return SEVERITY_BADGE_CLASSES[severity] || SEVERITY_BADGE_CLASSES.Low
}

export function getStatusTone(status) {
  return STATUS_BADGE_CLASSES[status] || 'bg-border text-text-secondary'
}

export function formatStatusLabel(status) {
  if (!status) return 'Unknown'
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
