// Synthetic demo constants/helpers for the Land Case workflow layered on top
// of the existing Land Intelligence parcel dataset (see landIntelligenceData.js).
//
// IMPORTANT: Same rule as the rest of the module — everything here is
// fabricated demo data for product-demonstration purposes only and must
// never be presented as an official legal or land-records determination.

export const CASE_STATUSES = [
  'AI DETECTED',
  'UNDER REVIEW',
  'VERIFIED',
  'FIELD SURVEY REQUIRED',
  'ACTION INITIATED',
  'RESOLVED',
]

export const OFFICER_VERIFICATION_OPTIONS = [
  {
    value: 'Confirmed Encroachment',
    icon: 'fa-solid fa-circle-check',
    hint: 'AI detection matches ground conditions.',
  },
  {
    value: 'False Positive',
    icon: 'fa-solid fa-circle-xmark',
    hint: 'Detection does not reflect an actual encroachment.',
  },
  {
    value: 'Requires Field Survey',
    icon: 'fa-solid fa-person-walking-arrow-right',
    hint: 'Ground verification needed before a determination.',
  },
  {
    value: 'Insufficient Evidence',
    icon: 'fa-solid fa-triangle-exclamation',
    hint: 'Imagery or metadata is inconclusive.',
  },
]

export const ASSIGNED_DEPARTMENTS = [
  'Revenue Department',
  'Municipal Corporation',
  'Forest Department',
  'Public Works Department',
  'Water Resources Department',
]

export const CASE_PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

// Maps an officer verification decision to the resulting case status.
export const VERIFICATION_TO_STATUS = {
  'Confirmed Encroachment': 'VERIFIED',
  'False Positive': 'RESOLVED',
  'Requires Field Survey': 'FIELD SURVEY REQUIRED',
  'Insufficient Evidence': 'UNDER REVIEW',
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

// Deterministic "Prototype Risk Assessment" breakdown derived from real
// parcel fields — not a random number generator, and not an official
// scoring methodology.
export function computeRiskBreakdown(parcel) {
  if (!parcel) return []
  const protectedZone = ['Government', 'Forest', 'Water Body'].includes(parcel.landType) ? 90 : 35
  const boundaryCrossing = /Boundary|Unauthorized|Road/i.test(parcel.type || '') ? 80 : 55

  return [
    { label: 'Encroachment Area', value: clamp(parcel.encroachmentPercentage * 2) },
    { label: 'Boundary Crossing', value: clamp(boundaryCrossing) },
    { label: 'AI Confidence', value: clamp(parcel.confidence) },
    { label: 'Protected Zone', value: clamp(protectedZone) },
    { label: 'Temporal Growth', value: clamp(parcel.riskScore * 0.9) },
  ]
}

// Deterministic 4-year synthetic change-detection timeline derived from a
// parcel's authorized/detected area figures.
export function buildChangeTimeline(parcel) {
  if (!parcel) return []
  const { authorizedArea, detectedArea, encroachmentArea, status } = parcel
  const resolved = status === 'Resolved'
  const y2024 = Math.round(authorizedArea + encroachmentArea * 0.25)
  const y2025 = Math.round(authorizedArea + encroachmentArea * 0.65)
  const y2026 = detectedArea

  return [
    {
      year: '2023',
      label: 'Clear',
      occupiedArea: authorizedArea,
      newStructures: 0,
      expandedStructures: 0,
      removedStructures: 0,
      newOccupiedArea: 0,
      potentialNewEncroachment: 0,
      description:
        'No structures detected within the surveyed boundary. Parcel footprint matches authorized land records.',
    },
    {
      year: '2024',
      label: 'Structure Detected',
      occupiedArea: y2024,
      newStructures: 1,
      expandedStructures: 0,
      removedStructures: 0,
      newOccupiedArea: Math.max(0, y2024 - authorizedArea),
      potentialNewEncroachment: 0,
      description:
        'A new structure was first identified near the parcel boundary in drone orthomosaic imagery.',
    },
    {
      year: '2025',
      label: 'Structure Expanded',
      occupiedArea: y2025,
      newStructures: 0,
      expandedStructures: 1,
      removedStructures: 0,
      newOccupiedArea: Math.max(0, y2025 - y2024),
      potentialNewEncroachment: Math.max(0, y2025 - authorizedArea),
      description: 'The existing structure footprint expanded further into the surveyed parcel area.',
    },
    {
      year: '2026',
      label: resolved ? 'Encroachment Cleared' : 'Potential Encroachment',
      occupiedArea: y2026,
      newStructures: 0,
      expandedStructures: resolved ? 0 : 1,
      removedStructures: resolved ? 1 : 0,
      newOccupiedArea: resolved ? 0 : Math.max(0, y2026 - y2025),
      potentialNewEncroachment: resolved ? 0 : encroachmentArea,
      description: resolved
        ? 'Follow-up drone survey confirms the encroaching structure has been removed and the parcel restored to its authorized boundary.'
        : 'Latest drone survey shows continued deviation beyond the authorized boundary, flagged as a potential encroachment.',
    },
  ]
}

export function generateCaseId() {
  const n = Math.floor(1000 + Math.random() * 9000)
  return `LC-${new Date().getFullYear()}-${n}`
}
