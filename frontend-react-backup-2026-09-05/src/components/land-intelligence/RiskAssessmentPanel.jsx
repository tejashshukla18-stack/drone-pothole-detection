import RiskBadge from './RiskBadge.jsx'
import { computeRiskBreakdown } from '../../data/landCaseData.js'
import { getDisplayRiskLevel } from './landIntelligenceHelpers.js'

function barColor(value) {
  if (value >= 75) return 'bg-p1'
  if (value >= 45) return 'bg-p2'
  return 'bg-p3'
}

export default function RiskAssessmentPanel({ parcel }) {
  if (!parcel) return null
  const breakdown = computeRiskBreakdown(parcel)
  const displayRisk = getDisplayRiskLevel(parcel)

  return (
    <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
          <i className="fa-solid fa-gauge-high text-accent-blue" /> Prototype Risk Assessment
        </h4>
        <RiskBadge level={displayRisk} />
      </div>

      <div className="mb-4 flex items-end gap-2">
        <span className="text-[26px] font-bold leading-none text-text-primary">
          {parcel.riskScore}
        </span>
        <span className="mb-0.5 text-xs text-text-muted">/ 100 &bull; Risk Level: {displayRisk}</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {breakdown.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-text-secondary">{item.label}</span>
              <span className="font-bold text-text-primary">{item.value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-input">
              <div
                className={`h-full rounded-full ${barColor(item.value)}`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-sm border border-dashed border-border-light bg-bg-input px-3 py-2 text-[11px] leading-relaxed text-text-muted">
        <i className="fa-solid fa-circle-info mr-1.5" />
        Prototype risk model for decision support only. This score is not an official legal
        threshold and does not constitute a determination of encroachment.
      </p>
    </div>
  )
}
