import { useEffect, useState } from 'react'
import RiskBadge from './RiskBadge.jsx'
import RiskAssessmentPanel from './RiskAssessmentPanel.jsx'
import EvidencePlaceholder from './EvidencePlaceholder.jsx'
import { OFFICER_VERIFICATION_OPTIONS } from '../../data/landCaseData.js'
import {
  formatArea,
  getCaseStatusBadgeClasses,
  getDisplayRiskLevel,
} from './landIntelligenceHelpers.js'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-[12px] text-text-muted">{label}</span>
      <span className="text-[12.5px] font-semibold text-text-primary">{value}</span>
    </div>
  )
}

export default function EvidenceViewerDrawer({
  parcel,
  caseRecord,
  onClose,
  onSubmitVerification,
  onOpenCreateCase,
  onOpenReport,
}) {
  const [verification, setVerification] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!parcel) return undefined
    setVerification(caseRecord?.verification || '')
    setNotes(caseRecord?.notes || '')

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcel, onClose])

  if (!parcel) return null

  const displayRisk = getDisplayRiskLevel(parcel)
  const boundaryCrossing =
    parcel.encroachmentArea > 0
      ? `${formatArea(parcel.encroachmentArea)} (${parcel.encroachmentPercentage}%)`
      : 'None Detected'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!verification) return
    setIsSubmitting(true)
    try {
      await onSubmitVerification?.(parcel.caseId, { verification, notes })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="animate-fade-in-up absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-border bg-bg-surface shadow-card-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate text-[15px] font-bold text-text-primary">
              <i className="fa-solid fa-satellite-dish text-accent-blue" /> {parcel.caseId}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              {parcel.parcelId} &bull; Survey No. {parcel.surveyNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getCaseStatusBadgeClasses(
                caseRecord?.status || 'AI DETECTED',
              )}`}
            >
              {caseRecord?.status || 'AI DETECTED'}
            </span>
            <button
              type="button"
              aria-label="Close evidence viewer"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-bg-card-hover hover:text-text-primary"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-blue/10 px-2.5 py-1 text-[11px] font-bold text-accent-blue">
              {parcel.type}
            </span>
            <RiskBadge level={displayRisk} />
          </div>

          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">
            Evidence
          </h4>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <EvidencePlaceholder variant="original" caseId={parcel.caseId} />
            <EvidencePlaceholder variant="ai_detection" caseId={parcel.caseId} />
            <EvidencePlaceholder variant="boundary_overlay" caseId={parcel.caseId} />
          </div>

          <div className="mb-4 rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
            <DetailRow label="Authorized Area" value={formatArea(parcel.authorizedArea)} />
            <DetailRow label="Detected Area" value={formatArea(parcel.detectedArea)} />
            <DetailRow label="Potential Encroachment" value={formatArea(parcel.encroachmentArea)} />
            <DetailRow label="Boundary Crossing" value={boundaryCrossing} />
            <DetailRow label="AI Confidence" value={`${parcel.confidence}%`} />
          </div>

          <div className="mb-4">
            <RiskAssessmentPanel parcel={parcel} />
          </div>

          <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
            <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
              <i className="fa-solid fa-user-shield text-accent-blue" /> Officer Verification
            </h4>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {OFFICER_VERIFICATION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors ${
                      verification === opt.value
                        ? 'border-accent-blue bg-accent-blue/5'
                        : 'border-border bg-bg-surface hover:bg-bg-card-hover'
                    }`}
                  >
                    <input
                      type="radio"
                      name="officerVerification"
                      className="mt-0.5"
                      value={opt.value}
                      checked={verification === opt.value}
                      onChange={() => setVerification(opt.value)}
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-text-primary">
                        <i className={`${opt.icon} text-[11px]`} /> {opt.value}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-text-muted">{opt.hint}</span>
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                  Officer Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add field observations, references, or justification..."
                  className="w-full rounded-sm border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!verification || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <i className="fa-solid fa-spinner fa-spin" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-4 rounded-sm border border-dashed border-border-light bg-bg-input px-3 py-2 text-[11px] text-text-muted">
            <i className="fa-solid fa-circle-info mr-1.5" />
            This record and all imagery shown are synthetic demo data generated for product
            demonstration and are not sourced from official land revenue records.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3.5">
          <span className="text-[11px] text-text-muted">
            {caseRecord?.landCase
              ? `Land Case ${caseRecord.landCase.id} \u2022 ${caseRecord.landCase.status}`
              : 'No Land Case created yet'}
          </span>
          <div className="flex items-center gap-2">
            {caseRecord?.landCase ? (
              <button
                type="button"
                onClick={() => onOpenReport?.(parcel, caseRecord.landCase)}
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-bg-card px-3.5 py-2 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
              >
                <i className="fa-solid fa-file-pdf" /> Generate Report
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenCreateCase?.(parcel)}
                className="inline-flex items-center gap-2 rounded-sm bg-ink px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-ink-hover"
              >
                <i className="fa-solid fa-folder-plus" /> Create Case
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
