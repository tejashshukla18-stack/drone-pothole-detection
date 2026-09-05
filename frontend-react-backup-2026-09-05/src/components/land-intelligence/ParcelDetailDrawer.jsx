import { useEffect } from 'react'
import RiskBadge from './RiskBadge.jsx'
import { formatArea, formatDate, getDisplayRiskLevel, getStatusBadgeClasses } from './landIntelligenceHelpers.js'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
      <span className="text-[12.5px] text-text-muted">{label}</span>
      <span className="text-[13px] font-semibold text-text-primary">{value}</span>
    </div>
  )
}

// Slide-over parcel detail drawer used by both the Encroachment Map and the
// Parcel Analysis table, so a click anywhere on a parcel opens the same view.
export default function ParcelDetailDrawer({ parcel, onClose }) {
  useEffect(() => {
    if (!parcel) return undefined

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [parcel, onClose])

  if (!parcel) return null

  const displayRisk = getDisplayRiskLevel(parcel)

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="animate-fade-in-up absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-border bg-bg-surface shadow-card-lg">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 truncate text-[15px] font-bold text-text-primary">
              <i className="fa-solid fa-map-location-dot text-accent-blue" /> {parcel.parcelId}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">Survey No. {parcel.surveyNumber}</p>
          </div>
          <button
            type="button"
            aria-label="Close parcel detail"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-bg-card-hover hover:text-text-primary"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-blue/10 px-2.5 py-1 text-[11px] font-bold text-accent-blue">
              {parcel.landType}
            </span>
            <RiskBadge level={displayRisk} />
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClasses(
                parcel.status,
              )}`}
            >
              {parcel.status}
            </span>
          </div>

          <div>
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">
              Location
            </h4>
            <DetailRow label="Parcel ID" value={parcel.parcelId} />
            <DetailRow label="Survey Number" value={parcel.surveyNumber} />
            <DetailRow label="Land Type" value={parcel.landType} />
            <DetailRow label="District" value={parcel.district} />
            <DetailRow label="Tehsil" value={parcel.tehsil} />
            <DetailRow label="Village" value={parcel.village} />
          </div>

          <div className="mt-4">
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">
              Area Assessment
            </h4>
            <DetailRow label="Authorized Area" value={formatArea(parcel.authorizedArea)} />
            <DetailRow label="Detected Area" value={formatArea(parcel.detectedArea)} />
            <DetailRow label="Potential Encroachment" value={formatArea(parcel.encroachmentArea)} />
            <DetailRow label="Encroachment %" value={`${parcel.encroachmentPercentage}%`} />
          </div>

          <div className="mt-4">
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">
              AI Assessment
            </h4>
            <DetailRow label="Risk" value={displayRisk} />
            <DetailRow label="AI Confidence" value={`${parcel.confidence}%`} />
            <DetailRow label="Detection Type" value={parcel.type} />
          </div>

          <div className="mt-4">
            <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">
              Case Status
            </h4>
            <DetailRow label="Case ID" value={parcel.caseId} />
            <DetailRow label="Last Inspected" value={formatDate(parcel.lastInspected)} />
            <DetailRow label="Status" value={parcel.status} />
          </div>

          <p className="mt-5 rounded-sm border border-dashed border-border-light bg-bg-input px-3 py-2 text-[11px] text-text-muted">
            <i className="fa-solid fa-circle-info mr-1.5" />
            This record is synthetic demo data generated for product demonstration and is not
            sourced from official land revenue records.
          </p>
        </div>
      </div>
    </div>
  )
}
