import { useEffect, useState } from 'react'
import { fetchAssetDetail } from '../../api/assets.js'
import { getAssetImages, getScorePillClasses } from './assetStatus.js'
import Spinner from '../ui/Spinner.jsx'
import ErrorState from '../ui/ErrorState.jsx'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'inspections', label: 'Drone Inspections' },
  { id: 'reports', label: 'Reports & Dossiers' },
  { id: 'repairs', label: 'Maintenance & Repairs' },
  { id: 'insights', label: 'Condition Insights' },
]

function OverviewTab({ data }) {
  const { asset } = data
  const images = getAssetImages(asset)

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div className="flex flex-col gap-2.5">
        <h4 className="text-sm font-bold text-accent-blue">
          <i className="fa-solid fa-circle-info" /> Asset Specifications
        </h4>
        <p className="text-[13px] text-text-secondary">
          <strong className="text-text-primary">Location:</strong> {asset.location.address}
        </p>
        <p className="text-[13px] text-text-secondary">
          <strong className="text-text-primary">Coordinates:</strong> Lat: {asset.location.lat}, Lng:{' '}
          {asset.location.lng}
        </p>
        <p className="text-[13px] text-text-secondary">
          <strong className="text-text-primary">Pavement Surface:</strong> {asset.surface_type}
        </p>
        <p className="text-[13px] text-text-secondary">
          <strong className="text-text-primary">Assigned Lead Engineer:</strong>{' '}
          {asset.assigned_engineer}
        </p>
        <p className="text-[13px] text-text-secondary">
          <strong className="text-text-primary">Current Repair Budget:</strong> $
          {asset.repair_budget_estimate.toLocaleString()}
        </p>
        <p className="text-[13px] text-text-secondary">
          <strong className="text-text-primary">Attached Drone Photolog:</strong> {images.length} frames
          compiled
        </p>
      </div>

      <div>
        {images.length > 0 ? (
          <>
            <img
              src={images[0]}
              alt={asset.name}
              className="h-[180px] w-full rounded-sm border border-border object-cover"
            />
            {images.length > 1 && (
              <div className="mt-2.5 grid grid-cols-4 gap-2">
                {images.map((imgUrl, i) => (
                  <div
                    key={imgUrl + i}
                    className="relative aspect-square overflow-hidden rounded-sm border border-border"
                  >
                    <img src={imgUrl} alt={`Plate ${i + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-white drop-shadow">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-[180px] w-full flex-col items-center justify-center gap-2.5 rounded-sm border border-dashed border-border bg-bg-input px-4 text-center text-text-muted">
            <i className="fa-solid fa-camera-retro text-2xl opacity-50" />
            <span className="text-[13px] font-semibold text-text-secondary">
              No Drone Photos Attached Yet
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function InspectionsTab({ data }) {
  const { asset, inspections } = data
  const images = getAssetImages(asset)

  return (
    <div>
      <h4 className="mb-2.5 text-sm font-bold text-accent-blue">
        Drone Inspection Flights for this Asset:
      </h4>
      {inspections.length === 0 ? (
        <p className="text-[13px] text-text-muted">No past inspection flights recorded.</p>
      ) : (
        inspections.map((m) => (
          <div
            key={m.id}
            className="mb-2 flex items-center justify-between rounded-sm border border-border bg-bg-input p-3"
          >
            <div>
              <strong className="text-[13px] text-text-primary">{m.title}</strong>
              <p className="text-xs text-text-muted">
                {m.date} • {m.drone_model} • Pilot: {m.pilot_name} •{' '}
                {m.total_images || (m.images ? m.images.length : 0)} Frames
              </p>
            </div>
          </div>
        ))
      )}

      {images.length > 0 && (
        <div className="mt-4">
          <h5 className="mb-2 text-xs font-semibold text-text-secondary">
            <i className="fa-solid fa-images" /> Full Flight Photolog Gallery ({images.length} frames):
          </h5>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {images.map((imgUrl, i) => (
              <div key={imgUrl + i} className="relative aspect-square overflow-hidden rounded-sm border border-border">
                <img src={imgUrl} alt={`Plate ${i + 1}`} className="h-full w-full object-cover" />
                <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-white drop-shadow">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReportsTab({ data }) {
  const { reports } = data
  return (
    <div>
      <h4 className="mb-2.5 text-sm font-bold text-accent-blue">Certified Engineering Dossiers:</h4>
      {reports.length === 0 ? (
        <p className="text-[13px] text-text-muted">No reports generated yet.</p>
      ) : (
        reports.map((r) => (
          <div
            key={r.id}
            className="mb-2 flex items-center justify-between rounded-sm border border-border bg-bg-input p-3"
          >
            <div>
              <strong className="text-[13px] text-text-primary">{r.title}</strong>
              <p className="text-xs text-text-muted">
                {r.report_number} • Issued: {r.generated_date} • Inspector: {r.inspector}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function RepairsTab({ data }) {
  const { repairs } = data
  return (
    <div>
      <h4 className="mb-2.5 text-sm font-bold text-accent-blue">Maintenance & Work Orders:</h4>
      {repairs.length === 0 ? (
        <p className="text-[13px] text-text-muted">No active work orders.</p>
      ) : (
        repairs.map((w) => (
          <div key={w.id} className="mb-2 rounded-sm border border-border bg-bg-input p-3">
            <div className="flex justify-between">
              <strong className="text-[13px] text-text-primary">{w.title}</strong>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  w.priority?.includes('P1') ? 'bg-p1/15 text-p1' : 'bg-p2/15 text-p2'
                }`}
              >
                {w.priority}
              </span>
            </div>
            <p className="my-1 text-xs text-text-muted">
              Contractor: {w.contractor} • Deadline: {w.deadline} • Cost: $
              {w.estimated_cost?.toLocaleString()}
            </p>
            <div className="text-[11px] font-semibold text-accent-teal">
              Status: {w.status} ({w.progress_percent}%)
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function InsightsTab({ data }) {
  const { asset } = data
  return (
    <div>
      <h4 className="mb-2.5 text-sm font-bold text-accent-blue">Condition Analytics:</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-sm bg-bg-input p-3 text-center">
          <span className="text-[11px] text-text-muted">Defect Density</span>
          <h3 className="text-lg font-bold text-p1">
            {(asset.total_defects / (asset.length_km || 1)).toFixed(1)} / km
          </h3>
        </div>
        <div className="rounded-sm bg-bg-input p-3 text-center">
          <span className="text-[11px] text-text-muted">Pavement Life Index</span>
          <h3 className="text-lg font-bold text-p3">7.4 Years</h3>
        </div>
        <div className="rounded-sm bg-bg-input p-3 text-center">
          <span className="text-[11px] text-text-muted">Risk Category</span>
          <h3 className="text-lg font-bold text-p2">{asset.status}</h3>
        </div>
      </div>
    </div>
  )
}

export default function AssetDetailDrawer({ assetId, onClose, onInspect }) {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!assetId) return

    let cancelled = false
    setStatus('loading')
    setActiveTab('overview')

    fetchAssetDetail(assetId)
      .then((result) => {
        if (cancelled) return
        setData(result)
        setStatus('success')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Error loading asset detail:', err)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [assetId])

  if (!assetId) return null

  return (
    <div className="animate-fade-in-up mt-4 rounded-md border border-border bg-bg-card shadow-card-sm">
      {status === 'loading' && <Spinner label="Loading asset detail..." />}

      {status === 'error' && (
        <div className="p-4">
          <ErrorState
            title="Couldn't load this asset"
            message="Something went wrong fetching the asset detail."
            onRetry={() => {
              setStatus('loading')
              fetchAssetDetail(assetId)
                .then((result) => {
                  setData(result)
                  setStatus('success')
                })
                .catch(() => setStatus('error'))
            }}
          />
        </div>
      )}

      {status === 'success' && data && (
        <>
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-accent-blue/10 px-2.5 py-0.5 text-[11px] font-bold text-accent-blue">
                {data.asset.type}
              </span>
              <h2 className="mt-1.5 truncate text-lg font-bold text-text-primary">{data.asset.name}</h2>
              <p className="text-xs text-text-muted">
                {data.asset.code} • {data.asset.district} • {data.asset.surface_type}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <span className="block text-[11px] text-text-muted">Health Score</span>
                <strong
                  className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${getScorePillClasses(
                    data.asset.health_score,
                  )}`}
                >
                  {data.asset.health_score}/100
                </strong>
              </div>
              <button
                type="button"
                aria-label="Close asset detail"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-bg-card-hover hover:text-text-primary"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-border px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-[13px] font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent-blue text-accent-blue'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'inspections' && <InspectionsTab data={data} />}
            {activeTab === 'reports' && <ReportsTab data={data} />}
            {activeTab === 'repairs' && <RepairsTab data={data} />}
            {activeTab === 'insights' && <InsightsTab data={data} />}

            {(activeTab === 'overview' || activeTab === 'inspections') &&
              getAssetImages(data.asset).length === 0 && (
                <button
                  type="button"
                  onClick={() => onInspect(data.asset.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-sm bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-blue-hover"
                >
                  <i className="fa-solid fa-plane-departure" /> Upload / Inspect Frames
                </button>
              )}
          </div>
        </>
      )}
    </div>
  )
}
