import EmptyState from '../ui/EmptyState.jsx'
import RiskBadge from './RiskBadge.jsx'
import {
  formatArea,
  formatDate,
  getCaseStatusBadgeClasses,
  getDisplayRiskLevel,
} from './landIntelligenceHelpers.js'

function ActionButton({ icon, label, onClick, tone = 'default' }) {
  const toneClasses = {
    default: 'text-text-secondary hover:bg-bg-card-hover hover:text-text-primary',
    good: 'text-p3 hover:bg-p3/10',
    bad: 'text-p1 hover:bg-p1/10',
    warn: 'text-p2 hover:bg-p2/10',
  }
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${toneClasses[tone]}`}
    >
      <i className={`${icon} text-[12px]`} />
    </button>
  )
}

export default function DetectionReviewTab({ parcels, caseRecords, onReview, onViewEvidence, onQuickVerify }) {
  if (!parcels || parcels.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-clipboard-list"
        title="No Detections to Review"
        message="AI-flagged parcel detections will appear here for officer review."
      />
    )
  }

  return (
    <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
          <i className="fa-solid fa-clipboard-check text-accent-blue" /> Detection Review
        </h3>
        <p className="mt-0.5 text-xs text-text-muted">
          {parcels.length} AI-flagged detections awaiting officer disposition
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-input text-[11px] uppercase tracking-wide text-text-muted">
              <th className="px-4 py-3 font-semibold">Case ID</th>
              <th className="px-4 py-3 font-semibold">Parcel ID</th>
              <th className="px-4 py-3 font-semibold">Detection Type</th>
              <th className="px-4 py-3 font-semibold">Affected Area</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold">AI Confidence</th>
              <th className="px-4 py-3 font-semibold">Detection Date</th>
              <th className="px-4 py-3 font-semibold">Evidence</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((p) => {
              const record = caseRecords?.[p.caseId]
              const status = record?.status || 'AI DETECTED'
              return (
                <tr key={p.caseId} className="border-b border-border last:border-0 hover:bg-bg-card-hover">
                  <td className="px-4 py-3 font-bold text-text-primary">{p.caseId}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.parcelId}</td>
                  <td className="px-4 py-3 text-text-secondary">{p.type}</td>
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {formatArea(p.encroachmentArea)}
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={getDisplayRiskLevel(p)} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{p.confidence}%</td>
                  <td className="px-4 py-3 text-text-secondary">{formatDate(p.detectedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onViewEvidence?.(p)}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
                    >
                      <i className="fa-solid fa-images text-[10px]" /> View Evidence
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getCaseStatusBadgeClasses(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <ActionButton icon="fa-solid fa-magnifying-glass" label="Review" onClick={() => onReview?.(p)} />
                      <ActionButton
                        icon="fa-solid fa-circle-check"
                        label="Confirm"
                        tone="good"
                        onClick={() => onQuickVerify?.(p, 'Confirmed Encroachment')}
                      />
                      <ActionButton
                        icon="fa-solid fa-circle-xmark"
                        label="False Positive"
                        tone="bad"
                        onClick={() => onQuickVerify?.(p, 'False Positive')}
                      />
                      <ActionButton
                        icon="fa-solid fa-person-walking-arrow-right"
                        label="Field Survey"
                        tone="warn"
                        onClick={() => onQuickVerify?.(p, 'Requires Field Survey')}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
