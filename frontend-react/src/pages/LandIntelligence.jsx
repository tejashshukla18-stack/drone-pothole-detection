import { useCallback, useEffect, useState } from 'react'
import Spinner from '../components/ui/Spinner.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import OverviewTab from '../components/land-intelligence/OverviewTab.jsx'
import EncroachmentMap from '../components/land-intelligence/EncroachmentMap.jsx'
import ParcelAnalysisTab from '../components/land-intelligence/ParcelAnalysisTab.jsx'
import ParcelDetailDrawer from '../components/land-intelligence/ParcelDetailDrawer.jsx'
import DetectionReviewTab from '../components/land-intelligence/DetectionReviewTab.jsx'
import ChangeDetectionTab from '../components/land-intelligence/ChangeDetectionTab.jsx'
import EvidenceViewerDrawer from '../components/land-intelligence/EvidenceViewerDrawer.jsx'
import CreateLandCaseModal from '../components/land-intelligence/CreateLandCaseModal.jsx'
import LandCaseReportModal from '../components/land-intelligence/LandCaseReportModal.jsx'
import { getLandOverview, getParcels, submitOfficerVerification } from '../api/landIntelligence.js'
import { VERIFICATION_TO_STATUS } from '../data/landCaseData.js'
import { useToast } from '../context/ToastContext.jsx'

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
  { id: 'map', label: 'Encroachment Map', icon: 'fa-solid fa-map-location-dot' },
  { id: 'parcels', label: 'Parcel Analysis', icon: 'fa-solid fa-table-list' },
  { id: 'review', label: 'Detection Review', icon: 'fa-solid fa-clipboard-check' },
  { id: 'change', label: 'Change Detection', icon: 'fa-solid fa-clock-rotate-left' },
]

export default function LandIntelligence() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')

  const [status, setStatus] = useState('loading') // loading | success | error
  const [overview, setOverview] = useState(null)
  const [parcels, setParcels] = useState([])

  const [selectedParcel, setSelectedParcel] = useState(null)

  // Land Case workflow state — keyed by caseId. Local/mock only; never
  // connected to Maintenance/Work Orders or /issue-escalation.
  const [caseRecords, setCaseRecords] = useState({})
  const [evidenceParcel, setEvidenceParcel] = useState(null)
  const [createCaseParcel, setCreateCaseParcel] = useState(null)
  const [reportTarget, setReportTarget] = useState(null) // { parcel, landCase }

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [overviewData, parcelsData] = await Promise.all([getLandOverview(), getParcels()])
      setOverview(overviewData)
      setParcels(parcelsData)
      setStatus('success')
    } catch (err) {
      console.error('Error loading Land Intelligence data:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleSelectParcel(parcel) {
    setSelectedParcel(parcel)
  }

  function handleRetry() {
    load().then(() => showToast('Land intelligence data refreshed.', 'success'))
  }

  function getRecord(caseId) {
    return caseRecords[caseId] || { status: 'AI DETECTED', verification: '', notes: '', landCase: null }
  }

  function updateRecord(caseId, patch) {
    setCaseRecords((prev) => ({
      ...prev,
      [caseId]: { ...getRecord(caseId), ...patch },
    }))
  }

  async function handleSubmitVerification(caseId, payload) {
    try {
      const result = await submitOfficerVerification(caseId, payload)
      updateRecord(caseId, {
        verification: result.verification,
        notes: result.notes,
        status: result.status,
        verifiedAt: result.verifiedAt,
      })
      showToast(`Verification recorded: ${result.verification}.`, 'success')
      setEvidenceParcel(null)
    } catch (err) {
      console.error('Error submitting officer verification:', err)
      showToast(err.message || 'Failed to submit verification.', 'error')
    }
  }

  function handleQuickVerify(parcel, verification) {
    const nextStatus = VERIFICATION_TO_STATUS[verification] || 'UNDER REVIEW'
    updateRecord(parcel.caseId, {
      verification,
      status: nextStatus,
      verifiedAt: new Date().toISOString(),
    })
    showToast(
      `${parcel.caseId} marked as ${verification}.`,
      verification === 'False Positive' ? 'info' : 'success',
    )
  }

  function handleCaseCreated(caseId, landCase) {
    updateRecord(caseId, { landCase, status: landCase.status })
  }

  if (status === 'loading') {
    return <Spinner label="Analyzing parcel boundaries..." />
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Unable to load Land Intelligence data"
        message="The parcel analysis dataset could not be loaded."
        onRetry={handleRetry}
      />
    )
  }

  const evidenceRecord = evidenceParcel ? getRecord(evidenceParcel.caseId) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab overview={overview} onSelectParcel={handleSelectParcel} />
      )}
      {activeTab === 'map' && (
        <EncroachmentMap parcels={parcels} onSelectParcel={handleSelectParcel} />
      )}
      {activeTab === 'parcels' && (
        <ParcelAnalysisTab parcels={parcels} onSelectParcel={handleSelectParcel} />
      )}
      {activeTab === 'review' && (
        <DetectionReviewTab
          parcels={parcels}
          caseRecords={caseRecords}
          onReview={(parcel) => setEvidenceParcel(parcel)}
          onViewEvidence={(parcel) => setEvidenceParcel(parcel)}
          onQuickVerify={handleQuickVerify}
        />
      )}
      {activeTab === 'change' && (
        <ChangeDetectionTab parcels={parcels} onSelectParcel={handleSelectParcel} />
      )}

      <ParcelDetailDrawer parcel={selectedParcel} onClose={() => setSelectedParcel(null)} />

      <EvidenceViewerDrawer
        parcel={evidenceParcel}
        caseRecord={evidenceRecord}
        onClose={() => setEvidenceParcel(null)}
        onSubmitVerification={handleSubmitVerification}
        onOpenCreateCase={(parcel) => setCreateCaseParcel(parcel)}
        onOpenReport={(parcel, landCase) => setReportTarget({ parcel, landCase })}
      />

      <CreateLandCaseModal
        isOpen={Boolean(createCaseParcel)}
        onClose={() => setCreateCaseParcel(null)}
        parcel={createCaseParcel}
        existingNotes={createCaseParcel ? getRecord(createCaseParcel.caseId).notes : ''}
        onCreated={handleCaseCreated}
      />

      <LandCaseReportModal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        parcel={reportTarget?.parcel}
        landCase={reportTarget?.landCase}
      />
    </div>
  )
}
