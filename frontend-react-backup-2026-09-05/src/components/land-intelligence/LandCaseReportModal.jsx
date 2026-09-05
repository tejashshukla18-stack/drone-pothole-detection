import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Spinner from '../ui/Spinner.jsx'
import RiskBadge from './RiskBadge.jsx'
import EvidencePlaceholder from './EvidencePlaceholder.jsx'
import { buildChangeTimeline } from '../../data/landCaseData.js'
import { generateLandCaseReport } from '../../api/landIntelligence.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatArea, formatDate, getCaseStatusBadgeClasses } from './landIntelligenceHelpers.js'

function ReportRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-[12px] text-text-muted">{label}</span>
      <span className="text-[12.5px] font-semibold text-text-primary">{value}</span>
    </div>
  )
}

export default function LandCaseReportModal({ isOpen, onClose, parcel, landCase }) {
  const { showToast } = useToast()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (!isOpen || !parcel || !landCase) return
    let cancelled = false
    setStatus('loading')
    generateLandCaseReport(landCase, parcel)
      .then((r) => {
        if (cancelled) return
        setReport(r)
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Error generating Land Case report:', err)
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, parcel, landCase])

  if (!parcel || !landCase) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Land Case Report \u2014 ${landCase.id}`}
      icon="fa-solid fa-file-pdf"
      maxWidth="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border px-4 py-2 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
          >
            Close
          </button>
          <button
            type="button"
            disabled={status !== 'success'}
            onClick={() => {
              showToast('Preparing report for print...', 'info')
              window.print()
            }}
            className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-print" /> Print / Save PDF
          </button>
        </>
      }
    >
      {status === 'loading' && <Spinner label="Compiling Land Case report..." />}

      {status === 'error' && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
          <i className="fa-solid fa-triangle-exclamation text-2xl text-p1" />
          <p className="text-[13px] text-text-muted">This report could not be generated.</p>
        </div>
      )}

      {status === 'success' && report && (
        <div className="printable-report-sheet flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h4 className="text-[14px] font-bold text-text-primary">
                Case {report.caseId} &bull; {report.parcelId}
              </h4>
              <p className="text-[11px] text-text-muted">
                Generated {formatDate(report.generatedAt)} &bull; {report.dataSource}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getCaseStatusBadgeClasses(
                report.verificationStatus,
              )}`}
            >
              {report.verificationStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <EvidencePlaceholder variant="original" caseId={report.caseId} />
            <EvidencePlaceholder variant="ai_detection" caseId={report.caseId} />
            <EvidencePlaceholder variant="boundary_overlay" caseId={report.caseId} />
          </div>

          <div className="rounded-md border border-border bg-bg-card p-4">
            <ReportRow label="Case ID" value={report.caseId} />
            <ReportRow label="Parcel ID" value={report.parcelId} />
            <ReportRow label="Survey Number" value={report.surveyNumber} />
            <ReportRow label="Location" value={report.location} />
            <ReportRow label="Land Type" value={report.landType} />
            <ReportRow label="Authorized Area" value={formatArea(report.authorizedArea)} />
            <ReportRow label="Detected Area" value={formatArea(report.detectedArea)} />
            <ReportRow label="Potential Encroachment" value={formatArea(report.potentialEncroachment)} />
            <ReportRow label="Risk" value={<RiskBadge level={report.risk} />} />
            <ReportRow label="AI Confidence" value={`${report.confidence}%`} />
          </div>

          <div>
            <h5 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">
              Historical Change
            </h5>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {buildChangeTimeline(parcel).map((step) => (
                <div
                  key={step.year}
                  className="rounded-md border border-border bg-bg-card px-2.5 py-2 text-center"
                >
                  <p className="text-[11px] font-bold text-text-primary">{step.year}</p>
                  <p className="mt-0.5 text-[10.5px] text-text-muted">{step.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="rounded-sm border border-dashed border-p2/40 bg-p2/5 px-3 py-2.5 text-[11.5px] font-medium leading-relaxed text-text-secondary">
            <i className="fa-solid fa-scale-balanced mr-1.5 text-p2" />
            AI-generated assessment for decision support. Final legal determination remains
            subject to verification by the competent authority.
          </p>
        </div>
      )}
    </Modal>
  )
}
