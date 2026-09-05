// Shared helpers for translating Land Intelligence risk/status values into
// consistent Tailwind classes and display strings.

export const RISK_BADGE_CLASSES = {
  High: 'bg-p1/15 text-p1',
  Medium: 'bg-p2/15 text-p2',
  Low: 'bg-p3/15 text-p3',
}

export const RISK_DOT_CLASSES = {
  High: 'bg-p1',
  Medium: 'bg-p2',
  Low: 'bg-p3',
}

export const STATUS_BADGE_CLASSES = {
  Verified: 'bg-p3/15 text-p3',
  Resolved: 'bg-accent-teal/15 text-accent-teal',
  'Under Review': 'bg-accent-blue/15 text-accent-blue',
  'Notice Issued': 'bg-p2/15 text-p2',
  'Pending Site Visit': 'bg-border text-text-secondary',
  Disputed: 'bg-p1/15 text-p1',
}

export function getRiskBadgeClasses(riskLevel) {
  return RISK_BADGE_CLASSES[riskLevel] || RISK_BADGE_CLASSES.Low
}

export function getStatusBadgeClasses(status) {
  return STATUS_BADGE_CLASSES[status] || 'bg-border text-text-secondary'
}

// ---------------------------------------------------------------------------
// Map / RiskBadge 4-level scheme: HIGH / MEDIUM / LOW / CLEAR, plus a
// separate "Verified" status accent (blue) used on the Encroachment Map
// legend. A parcel whose case has been marked "Resolved" is displayed as
// CLEAR on the map and in RiskBadge, independent of its underlying
// (historical) risk score.
// ---------------------------------------------------------------------------
export const MAP_LEGEND_COLORS = {
  CLEAR: '#10b981', // green
  LOW: '#eab308', // yellow
  MEDIUM: '#f59e0b', // orange
  HIGH: '#ef4444', // red
  VERIFIED: '#0284c7', // blue (status accent, drawn as marker/stroke)
}

export function getDisplayRiskLevel(parcel) {
  if (!parcel) return 'LOW'
  if (parcel.status === 'Resolved') return 'CLEAR'
  return String(parcel.riskLevel || 'Low').toUpperCase()
}

export function isVerified(parcel) {
  return parcel?.status === 'Verified'
}

// ---------------------------------------------------------------------------
// Land Case workflow status badge styling (Detection Review / Land Case).
// ---------------------------------------------------------------------------
export const CASE_STATUS_BADGE_CLASSES = {
  'AI DETECTED': 'bg-accent-indigo/15 text-accent-indigo',
  'UNDER REVIEW': 'bg-accent-blue/15 text-accent-blue',
  VERIFIED: 'bg-p3/15 text-p3',
  'FIELD SURVEY REQUIRED': 'bg-p2/15 text-p2',
  'ACTION INITIATED': 'bg-accent-teal/15 text-accent-teal',
  RESOLVED: 'bg-border text-text-secondary',
}

export function getCaseStatusBadgeClasses(status) {
  return CASE_STATUS_BADGE_CLASSES[status] || 'bg-border text-text-secondary'
}

export function formatArea(sqm) {
  if (sqm === null || sqm === undefined) return '—'
  return `${sqm.toLocaleString('en-IN')} m²`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
