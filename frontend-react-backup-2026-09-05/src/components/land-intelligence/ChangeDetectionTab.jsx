import { useMemo, useState } from 'react'
import EmptyState from '../ui/EmptyState.jsx'
import FormField from '../ui/FormField.jsx'
import RiskBadge from './RiskBadge.jsx'
import EvidencePlaceholder from './EvidencePlaceholder.jsx'
import { buildChangeTimeline } from '../../data/landCaseData.js'
import { formatArea, getDisplayRiskLevel } from './landIntelligenceHelpers.js'

const STAT_FIELDS = [
  { key: 'newStructures', label: 'New Structures', icon: 'fa-solid fa-house-chimney' },
  { key: 'expandedStructures', label: 'Expanded Structures', icon: 'fa-solid fa-expand' },
  { key: 'removedStructures', label: 'Removed Structures', icon: 'fa-solid fa-trash' },
]

export default function ChangeDetectionTab({ parcels, onSelectParcel }) {
  const [selectedCaseId, setSelectedCaseId] = useState(parcels?.[0]?.caseId || '')
  const [activeYear, setActiveYear] = useState('2026')

  const selectedParcel = useMemo(
    () => (parcels || []).find((p) => p.caseId === selectedCaseId) || parcels?.[0] || null,
    [parcels, selectedCaseId],
  )

  const timeline = useMemo(() => buildChangeTimeline(selectedParcel), [selectedParcel])
  const activeStep = timeline.find((t) => t.year === activeYear) || timeline[timeline.length - 1]

  if (!parcels || parcels.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-clock-rotate-left"
        title="No Parcels Available"
        message="Change detection timelines will appear here once parcels are analysed."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
              <i className="fa-solid fa-clock-rotate-left text-accent-blue" /> Change Detection
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Multi-year drone survey comparison for a selected parcel
            </p>
          </div>
          <FormField
            label="Parcel"
            as="select"
            className="w-72"
            value={selectedCaseId || selectedParcel?.caseId || ''}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            options={parcels.map((p) => ({
              value: p.caseId,
              label: `${p.parcelId} \u2014 ${p.caseId}`,
            }))}
          />
        </div>
      </div>

      {selectedParcel && (
        <>
          <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
            <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
              {timeline.map((step) => (
                <button
                  key={step.year}
                  type="button"
                  onClick={() => setActiveYear(step.year)}
                  className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                    activeYear === step.year
                      ? 'border-accent-blue text-accent-blue'
                      : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
                >
                  {step.year}
                  <span className="ml-2 text-[11px] font-normal text-text-muted">{step.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <EvidencePlaceholder
                variant={activeStep.year === '2026' ? 'boundary_overlay' : 'original'}
                caseId={`${selectedParcel.caseId}-${activeStep.year}`}
              />
              <div>
                <p className="mb-3 text-[13px] leading-relaxed text-text-secondary">
                  {activeStep.description}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {STAT_FIELDS.map((f) => (
                    <div
                      key={f.key}
                      className="rounded-md border border-border bg-bg-input px-3 py-2.5 text-center"
                    >
                      <i className={`${f.icon} mb-1 block text-[13px] text-accent-blue`} />
                      <p className="text-[16px] font-bold text-text-primary">{activeStep[f.key]}</p>
                      <p className="text-[10.5px] text-text-muted">{f.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-border bg-bg-input px-3 py-2.5">
                    <p className="text-[11px] text-text-muted">New Occupied Area</p>
                    <p className="text-[14px] font-bold text-text-primary">
                      {formatArea(activeStep.newOccupiedArea)}
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-bg-input px-3 py-2.5">
                    <p className="text-[11px] text-text-muted">Potential New Encroachment</p>
                    <p className="text-[14px] font-bold text-p1">
                      {formatArea(activeStep.potentialNewEncroachment)}
                    </p>
                  </div>
                </div>
                {onSelectParcel && (
                  <button
                    type="button"
                    onClick={() => onSelectParcel(selectedParcel)}
                    className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-blue hover:underline"
                  >
                    View Parcel Detail <i className="fa-solid fa-arrow-right text-[10px]" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
            <h4 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-text-primary">
              <i className="fa-solid fa-scale-unbalanced text-accent-blue" /> Previous Survey vs Current
              Survey
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Previous Survey &bull; 2023
                </p>
                <EvidencePlaceholder variant="original" caseId={`${selectedParcel.caseId}-prev`} />
                <p className="mt-1.5 text-[12px] text-text-secondary">
                  {formatArea(selectedParcel.authorizedArea)} authorized footprint
                </p>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Current Survey &bull; 2026
                </p>
                <EvidencePlaceholder variant="boundary_overlay" caseId={`${selectedParcel.caseId}-curr`} />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[12px] text-text-secondary">
                    {formatArea(selectedParcel.detectedArea)} detected footprint
                  </p>
                  <RiskBadge level={getDisplayRiskLevel(selectedParcel)} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
