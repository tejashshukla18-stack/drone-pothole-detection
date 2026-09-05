// API abstraction for the Land Encroachment Intelligence module.
//
// Today this returns locally bundled synthetic demo data (see
// src/data/landIntelligenceData.js). The function signatures mirror what a
// real Express/GIS backend endpoint would return, so swapping in real HTTP
// calls later only requires changing the implementations below.

import {
  DATA_SOURCE_LABEL,
  ENCROACHMENT_TREND,
  LAND_TYPE_DISTRIBUTION,
  OVERVIEW_KPIS,
  PARCELS,
  RISK_DISTRIBUTION,
} from '../data/landIntelligenceData.js'
import { generateCaseId, VERIFICATION_TO_STATUS } from '../data/landCaseData.js'

// Small artificial delay so loading states are visible, consistent with how
// the rest of the app feels while talking to the backend.
function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * GET-equivalent: overview KPIs + chart data + recent detections.
 */
export async function getLandOverview() {
  await delay()
  const recentDetections = [...PARCELS]
    .sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt))
    .slice(0, 10)

  return {
    kpis: OVERVIEW_KPIS,
    riskDistribution: RISK_DISTRIBUTION,
    encroachmentTrend: ENCROACHMENT_TREND,
    landTypeDistribution: LAND_TYPE_DISTRIBUTION,
    recentDetections,
    dataSource: DATA_SOURCE_LABEL,
  }
}

/**
 * GET-equivalent: full parcel list backing the Parcel Analysis tab and map.
 */
export async function getParcels() {
  await delay()
  return PARCELS
}

/**
 * GET-equivalent: encroachment case records (currently 1:1 with parcels,
 * since every demo parcel represents a detected encroachment case).
 */
export async function getEncroachments() {
  await delay()
  return PARCELS
}

/**
 * GET-equivalent: single parcel detail lookup by parcelId or caseId.
 */
export async function getParcelById(id) {
  await delay(200)
  const parcel = PARCELS.find((p) => p.parcelId === id || p.caseId === id)
  if (!parcel) {
    throw new Error(`Parcel "${id}" was not found in the demo dataset.`)
  }
  return parcel
}

// ---------------------------------------------------------------------------
// Land Case workflow (Detection Review, Officer Verification, Change
// Detection, Land Case creation, Reports). Deliberately kept local/mock —
// there is no real backend/route for land parcels yet, and this must never
// be wired into the Maintenance/Work Order or Issue Escalation systems.
// ---------------------------------------------------------------------------

/**
 * Submits an officer's verification decision for an AI-detected encroachment.
 * Mock POST-equivalent — resolves with the record the caller should merge
 * into local component state.
 */
export async function submitOfficerVerification(caseId, { verification, notes } = {}) {
  await delay(300)
  if (!verification) {
    throw new Error('Please select an officer verification outcome.')
  }
  return {
    caseId,
    verification,
    notes: notes || '',
    status: VERIFICATION_TO_STATUS[verification] || 'UNDER REVIEW',
    verifiedAt: new Date().toISOString(),
  }
}

/**
 * Creates a local Land Case for a given encroachment/parcel case. This is a
 * standalone workflow — NOT connected to Maintenance/Work Orders or
 * /issue-escalation. Mock POST-equivalent.
 */
export async function createLandCase(encroachmentId, payload = {}) {
  await delay(400)
  if (!encroachmentId) {
    throw new Error('An encroachment case is required to create a Land Case.')
  }
  return {
    id: generateCaseId(),
    encroachmentId,
    status: 'UNDER REVIEW',
    createdAt: new Date().toISOString(),
    ...payload,
  }
}

/**
 * Generates a mock Land Case report payload. There is no live Reports
 * backend for land parcels yet, so this is produced entirely client-side,
 * mirroring the shape the existing Reports architecture would expect.
 */
export async function generateLandCaseReport(landCase, parcel) {
  await delay(500)
  if (!landCase || !parcel) {
    throw new Error('A Land Case and parcel are required to generate a report.')
  }
  return {
    reportId: `RPT-${landCase.id}`,
    generatedAt: new Date().toISOString(),
    caseId: landCase.id,
    parcelId: parcel.parcelId,
    surveyNumber: parcel.surveyNumber,
    location: `${parcel.village}, ${parcel.tehsil}, ${parcel.district} District`,
    landType: parcel.landType,
    authorizedArea: parcel.authorizedArea,
    detectedArea: parcel.detectedArea,
    potentialEncroachment: parcel.encroachmentArea,
    risk: parcel.riskLevel,
    confidence: parcel.confidence,
    verificationStatus: landCase.status,
    dataSource: DATA_SOURCE_LABEL,
  }
}
