// Shared helpers for translating mission/defect data into consistent
// Tailwind classes and display strings across the Inspections workflow.

export const SEVERITY_BADGE_CLASSES = {
  High: 'bg-p1/15 text-p1',
  Medium: 'bg-p2/15 text-p2',
  Low: 'bg-p3/15 text-p3',
}

export const STATUS_BADGE_CLASSES = {
  Completed: 'bg-p3/15 text-p3',
  'In Review': 'bg-p2/15 text-p2',
  Processing: 'bg-accent-blue/15 text-accent-blue',
  Scheduled: 'bg-border text-text-secondary',
}

export function getMissionDefectCount(item) {
  if (!item) return 0
  if (Array.isArray(item.bounding_boxes)) return item.bounding_boxes.length
  return item.metrics?.defects_found || 0
}

export function getActiveDefectCount(item) {
  if (!item?.bounding_boxes) return getMissionDefectCount(item)
  return item.bounding_boxes.filter((b) => b.status !== 'Rejected').length
}

export function getImageUrl(item) {
  if (!item) return ''
  return item.image_url || `/dataset/${encodeURIComponent(item.filename)}`
}

export function getSeverityTone(severity) {
  return SEVERITY_BADGE_CLASSES[severity] || SEVERITY_BADGE_CLASSES.Low
}

export function formatDefectLabel(box, idx) {
  if (!box) return `Cavity #${idx + 1}`
  return box.label
    ? box.label.replace(/\s*\(\d+%\)$/, '').replace(/\s*\[\d+%\]$/, '')
    : `Cavity #${idx + 1}`
}

export function getConfidenceNumber(box) {
  return parseInt(box?.confidence, 10) || 85
}

export function getConfidenceTone(confNum) {
  if (confNum >= 90) return SEVERITY_BADGE_CLASSES.High
  if (confNum >= 80) return SEVERITY_BADGE_CLASSES.Medium
  return SEVERITY_BADGE_CLASSES.Low
}

export const SAMPLE_DATASET_FILENAMES = [
  'thumb (1).jpg',
  'thumb (2).jpg',
  'thumb (3).jpg',
  'thumb (4).jpg',
  'thumb (5).jpg',
  'thumb (6).jpg',
]

export const SENSITIVITY_OPTIONS = [
  { value: 'balanced', label: 'Optimal F1-Score (τ = 0.30 | F1: 0.97)' },
  { value: 'precision', label: 'High Precision (τ = 0.90 | P: 0.97)' },
  { value: 'high', label: 'High Recall Survey (τ = 0.15 | R: 0.99)' },
]

export function getOperatingThreshold(sensitivity) {
  if (sensitivity === 'high') return 0.15
  if (sensitivity === 'precision') return 0.9
  return 0.3
}

export const SEVERITY_DOT_CLASSES = {
  High: 'bg-p1',
  Medium: 'bg-p2',
  Low: 'bg-p3',
}

// Rolls the mission log up into a small set of fleet-level numbers for the
// stats strip at the top of the Inspections page.
export function getFleetStats(missions) {
  const list = Array.isArray(missions) ? missions : []
  return {
    totalMissions: list.length,
    totalFrames: list.reduce((sum, m) => sum + (m.total_images || 0), 0),
    totalDefects: list.reduce((sum, m) => sum + (m.defects_found || 0), 0),
    highSeverityCount: list.filter((m) => m.severity === 'High').length,
  }
}