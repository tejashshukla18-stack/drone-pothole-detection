import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KpiGrid from '../components/dashboard/KpiGrid.jsx'
import EscalationKpiStrip from '../components/dashboard/EscalationKpiStrip.jsx'
import QuickActionsBar from '../components/dashboard/QuickActionsBar.jsx'
import DashboardMap from '../components/dashboard/DashboardMap.jsx'
import RecentActivity from '../components/dashboard/RecentActivity.jsx'
import RegisterAssetModal from '../components/assets/RegisterAssetModal.jsx'
import CreateWorkOrderModal from '../components/inspections/review/CreateWorkOrderModal.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import DashboardEmptyPanel from '../components/dashboard/DashboardEmptyPanel.jsx'
import { fetchDashboardOverview } from '../api/dashboard.js'
import { fetchSettings } from '../api/settings.js'

export default function Dashboard() {
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading') // loading | success | error
  const [overview, setOverview] = useState(null)
  const [nfzAlertRadiusM, setNfzAlertRadiusM] = useState(200)

  const [isRegisterOpen, setRegisterOpen] = useState(false)
  const [isWorkOrderOpen, setWorkOrderOpen] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchDashboardOverview()
      setOverview(data)
      const settings = await fetchSettings().catch(() => ({ settings: {} }))
      setNfzAlertRadiusM(Number(settings.settings?.nfz_alert_radius_m) || 200)
      setStatus('success')
    } catch (err) {
      console.error('Error fetching dashboard overview:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (status === 'loading') {
    return <Spinner label="Loading executive overview..." />
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Unable to load dashboard overview"
        message="The municipal overview could not be retrieved from the server."
        onRetry={load}
      />
    )
  }

  const kpis = overview?.kpis || {}
  const assets = overview?.assets || []
  const activities = overview?.recent_activity || []
  const hasAnyData = assets.length > 0 || activities.length > 0 || (kpis.total_assets || 0) > 0
  const hasEscalationData =
    (kpis.escalation_critical_issues || 0) > 0 ||
    (kpis.escalation_open_tickets || 0) > 0 ||
    (kpis.escalation_pending_authority_response || 0) > 0

  return (
    <div className="flex flex-col">
      <KpiGrid kpis={kpis} />

      {hasEscalationData && <EscalationKpiStrip kpis={kpis} />}

      <QuickActionsBar
        onStartInspection={() => navigate('/inspections')}
        onLoadSample={() => navigate('/inspections?loadSample=1')}
        onRegisterAsset={() => setRegisterOpen(true)}
        onDispatchWorkOrder={() => setWorkOrderOpen(true)}
      />

      {!hasAnyData ? (
        <DashboardEmptyPanel
          icon="fa-solid fa-satellite-dish"
          title="No municipal activity yet"
          message="Register an asset or load the sample dataset to see live KPIs, the GIS map, and activity here."
          action={
            <button
              type="button"
              onClick={() => navigate('/inspections?loadSample=1')}
              className="inline-flex items-center gap-2 rounded-sm bg-[#0f172a] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1e293b]"
            >
              <i className="fa-solid fa-folder-open" /> Load Sample Dataset
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.8fr_1fr]">
          <div className="flex flex-col rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
                  <i className="fa-solid fa-map-location-dot text-accent-blue" /> Municipal GIS Defect &amp; Drone
                  Flight Map
                </h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  Interactive georeferenced road condition heatmarkers and flight missions
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <span className="h-2 w-2 rounded-full bg-p1" /> P1 Critical
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <span className="h-2 w-2 rounded-full bg-p2" /> P2 Scheduled
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                  <span className="h-2 w-2 rounded-full bg-p3" /> P3 Routine
                </span>
              </div>
            </div>
            <DashboardMap assets={assets} alertRadiusM={nfzAlertRadiusM} />
          </div>

          <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
            <div className="mb-3">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
                <i className="fa-solid fa-clock-rotate-left text-accent-blue" /> Mission &amp; Repair Activity
              </h3>
              <p className="mt-0.5 text-xs text-text-muted">
                Latest updates from field drones and road crews
              </p>
            </div>
            <RecentActivity activities={activities} />
          </div>
        </div>
      )}

      <RegisterAssetModal
        isOpen={isRegisterOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => {
          setRegisterOpen(false)
          load()
        }}
      />

      <CreateWorkOrderModal
        isOpen={isWorkOrderOpen}
        onClose={() => setWorkOrderOpen(false)}
        assets={assets}
        onDispatched={() => {
          setWorkOrderOpen(false)
          load()
        }}
      />
    </div>
  )
}
