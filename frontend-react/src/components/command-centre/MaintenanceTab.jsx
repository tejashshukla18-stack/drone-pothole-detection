import { useCallback, useEffect, useState } from 'react'
import { fetchMaintenance } from '../../api/maintenance.js'
import { fetchAssets } from '../../api/assets.js'
import Spinner from '../ui/Spinner.jsx'
import ErrorState from '../ui/ErrorState.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import WorkOrderCard from './WorkOrderCard.jsx'
import CreateWorkOrderModal from '../inspections/review/CreateWorkOrderModal.jsx'

export default function MaintenanceTab() {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [workOrders, setWorkOrders] = useState([])
  const [assets, setAssets] = useState([])
  const [isWorkOrderOpen, setWorkOrderOpen] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const [orders, assetList] = await Promise.all([fetchMaintenance(), fetchAssets()])
      setWorkOrders(orders)
      setAssets(assetList)
      setStatus('success')
    } catch (err) {
      console.error('Error fetching maintenance work orders:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (status === 'loading') {
    return <Spinner label="Loading work orders..." />
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Unable to load maintenance data"
        message="Work orders could not be retrieved from the server."
        onRetry={load}
      />
    )
  }

  const p1Count = workOrders.filter((w) => w.priority?.includes('P1')).length
  const p2Count = workOrders.filter((w) => w.priority?.includes('P2')).length
  const p3Count = workOrders.filter((w) => w.priority?.includes('P3')).length
  const totalCost = workOrders.reduce((sum, w) => sum + (w.estimated_cost || 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-text-primary">
            <i className="fa-solid fa-helmet-safety text-accent-blue" /> Maintenance &amp; Work Order
            Management
          </h2>
          <p className="mt-1 text-[13px] text-text-muted">
            Track civil contractor dispatch, repair milestones, and pavement rehabilitation
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWorkOrderOpen(true)}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
        >
          <i className="fa-solid fa-plus" /> Dispatch Work Order
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="fa-solid fa-fire"
          tone="border-l-p1"
          label="P1 - Immediate Repairs"
          value={`${p1Count} Active Order${p1Count === 1 ? '' : 's'}`}
        />
        <StatCard
          icon="fa-solid fa-calendar-check"
          tone="border-l-p2"
          label="P2 - Scheduled Maintenance"
          value={`${p2Count} Active Order${p2Count === 1 ? '' : 's'}`}
        />
        <StatCard
          icon="fa-solid fa-shield-halved"
          tone="border-l-p3"
          label="P3 - Routine Preventive"
          value={`${p3Count} Active Order${p3Count === 1 ? '' : 's'}`}
        />
        <StatCard
          icon="fa-solid fa-dollar-sign"
          tone="border-l-accent-blue"
          label="Allocated Budget"
          value={`$${totalCost.toLocaleString()}`}
        />
      </div>

      {workOrders.length === 0 ? (
        <EmptyState
          icon="fa-solid fa-helmet-safety"
          title="No Active Work Orders"
          message="Dispatch rehabilitation and milling work orders to road maintenance contractors."
          action={
            <button
              type="button"
              onClick={() => setWorkOrderOpen(true)}
              className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
            >
              <i className="fa-solid fa-plus" /> Create Work Order
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workOrders.map((wo) => (
            <WorkOrderCard key={wo.id} workOrder={wo} />
          ))}
        </div>
      )}

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

function StatCard({ icon, tone, label, value }) {
  return (
    <div className={`flex items-center gap-3 rounded-md border border-border border-l-4 ${tone} bg-bg-card p-4 shadow-card-sm`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-surface text-base text-text-secondary">
        <i className={icon} />
      </div>
      <div className="min-w-0">
        <span className="block text-[11px] font-semibold text-text-muted">{label}</span>
        <h3 className="truncate text-[16px] font-bold text-text-primary">{value}</h3>
      </div>
    </div>
  )
}
