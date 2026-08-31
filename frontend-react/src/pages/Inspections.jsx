import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import UploadPanel from '../components/inspections/UploadPanel.jsx'
import MissionsTable from '../components/inspections/MissionsTable.jsx'
import CreateMissionModal from '../components/inspections/CreateMissionModal.jsx'
import ReviewWorkbench from '../components/inspections/review/ReviewWorkbench.jsx'
import { fetchAssets } from '../api/assets.js'
import { fetchMissions, inspectBatch, inspectSample } from '../api/inspections.js'
import { SAMPLE_DATASET_FILENAMES } from '../components/inspections/inspectionHelpers.js'
import { useToast } from '../context/ToastContext.jsx'

export default function Inspections() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const presetAssetId = searchParams.get('assetId') || ''

  const [assets, setAssets] = useState([])
  const [assetsStatus, setAssetsStatus] = useState('loading')

  const [missions, setMissions] = useState([])
  const [missionsStatus, setMissionsStatus] = useState('loading')

  const [targetAssetId, setTargetAssetId] = useState(presetAssetId)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(null)

  const [isCreateMissionOpen, setCreateMissionOpen] = useState(false)

  // Review workbench state - null means "show the upload + missions workspace".
  const [reviewSession, setReviewSession] = useState(null) // { mission, results }

  const loadAssets = useCallback(async () => {
    setAssetsStatus('loading')
    try {
      const data = await fetchAssets()
      setAssets(data)
      setAssetsStatus('success')
    } catch (err) {
      console.error('Error fetching assets:', err)
      setAssetsStatus('error')
    }
  }, [])

  const loadMissions = useCallback(async () => {
    setMissionsStatus('loading')
    try {
      const data = await fetchMissions()
      setMissions(data)
      setMissionsStatus('success')
    } catch (err) {
      console.error('Error fetching missions:', err)
      setMissionsStatus('error')
    }
  }, [])

  useEffect(() => {
    loadAssets()
    loadMissions()
  }, [loadAssets, loadMissions])

  useEffect(() => {
    if (presetAssetId) setTargetAssetId(presetAssetId)
  }, [presetAssetId])

  // Supports the Dashboard "1-Click Load Sample Dataset" quick action, which
  // links here with ?loadSample=1 to trigger the sample flight immediately.
  useEffect(() => {
    if (searchParams.get('loadSample') === '1') {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('loadSample')
          return next
        },
        { replace: true },
      )
      handleLoadSampleDataset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openReview(mission) {
    setReviewSession({ mission, results: mission.images || [] })
  }

  function closeReview() {
    setReviewSession(null)
    loadMissions()
    loadAssets()
  }

  function handleWorkspaceSync() {
    loadMissions()
    loadAssets()
  }

  async function runInspection(runner, successLabel) {
    setIsProcessing(true)
    try {
      setProgress({ percent: 30, label: 'Uploading Drone Aerial Imagery...' })
      await new Promise((r) => setTimeout(r, 350))
      setProgress({ percent: 70, label: 'NMS Suppression & Severity Classification...' })

      const data = await runner()

      setProgress({ percent: 100, label: 'Inspection Complete!' })
      await new Promise((r) => setTimeout(r, 350))

      const mission = data.mission
      const results = data.results || []

      await loadMissions()
      await loadAssets()

      showToast(successLabel(results.length), 'success')
      setSelectedFiles([])
      if (mission) openReview({ ...mission, images: results.length > 0 ? results : mission.images })
    } catch (err) {
      console.error('Error running inspection:', err)
      showToast(err.message || 'Failed to complete drone inspection.', 'error')
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  function handleLoadSampleDataset() {
    runInspection(
      () => inspectSample({ assetId: targetAssetId, filenames: SAMPLE_DATASET_FILENAMES }),
      () => 'Sample drone flight imagery loaded & analyzed!',
    )
  }

  function handleRunBatchInspection() {
    if (selectedFiles.length === 0) return
    runInspection(
      () => inspectBatch({ files: selectedFiles, assetId: targetAssetId }),
      (count) => `Batch inspection complete for ${count} frames!`,
    )
  }

  function handleMissionCreated() {
    loadMissions()
  }

  if (reviewSession) {
    return (
      <ReviewWorkbench
        mission={reviewSession.mission}
        results={reviewSession.results}
        assets={assets}
        onBack={closeReview}
        onSynced={handleWorkspaceSync}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
      <UploadPanel
        assets={assets}
        targetAssetId={targetAssetId}
        onTargetAssetChange={(id) => {
          setTargetAssetId(id)
          if (id) setSearchParams({ assetId: id }, { replace: true })
        }}
        selectedFiles={selectedFiles}
        onFilesSelected={setSelectedFiles}
        onRunInspection={handleRunBatchInspection}
        onLoadSampleDataset={handleLoadSampleDataset}
        isProcessing={isProcessing}
        progress={progress}
      />

      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
              <i className="fa-solid fa-clipboard-list text-accent-blue" /> Drone Inspection Missions
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              Comprehensive logs of autonomous aerial pavement surveys
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreateMissionOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
          >
            <i className="fa-solid fa-plus" /> New Flight Mission
          </button>
        </div>

        <MissionsTable
          status={missionsStatus}
          missions={missions}
          onRetry={loadMissions}
          onReview={openReview}
          onCreateMission={() => setCreateMissionOpen(true)}
        />
      </div>

      <CreateMissionModal
        isOpen={isCreateMissionOpen}
        onClose={() => setCreateMissionOpen(false)}
        assets={assets}
        defaultAssetId={targetAssetId}
        onCreated={handleMissionCreated}
      />
    </div>
  )
}
