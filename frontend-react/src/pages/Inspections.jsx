import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import UploadPanel from '../components/inspections/UploadPanel.jsx'
import MissionsTable from '../components/inspections/MissionsTable.jsx'
import CreateMissionModal from '../components/inspections/CreateMissionModal.jsx'
import ReviewWorkbench from '../components/inspections/review/ReviewWorkbench.jsx'
import { fetchAssets } from '../api/assets.js'
import {
  fetchLiveInspection,
  fetchMissions,
  fetchVideoInspection,
  inspectSample,
  startLiveInspection,
  startVideoInspection,
  stopLiveInspection,
} from '../api/inspections.js'
import { SAMPLE_DATASET_FILENAMES, getFleetStats } from '../components/inspections/inspectionHelpers.js'
import { useToast } from '../context/ToastContext.jsx'

const STAT_TILES = [
  { key: 'totalMissions', label: 'Missions Logged', icon: 'fa-clipboard-list', tone: 'text-text-primary' },
  { key: 'totalFrames', label: 'Frames Analyzed', icon: 'fa-film', tone: 'text-text-primary' },
  { key: 'totalDefects', label: 'Defects Found', icon: 'fa-triangle-exclamation', tone: 'text-p2' },
  { key: 'highSeverityCount', label: 'High Severity', icon: 'fa-circle-exclamation', tone: 'text-p1' },
]

export default function Inspections() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const presetAssetId = searchParams.get('assetId') || ''

  const [assets, setAssets] = useState([])
  const [assetsStatus, setAssetsStatus] = useState('loading')

  const [missions, setMissions] = useState([])
  const [missionsStatus, setMissionsStatus] = useState('loading')

  const [targetAssetId, setTargetAssetId] = useState(presetAssetId)
  const [selectedModel, setSelectedModel] = useState('pothole')
  const [liveSource, setLiveSource] = useState('')
  const [liveModel, setLiveModel] = useState('both')
  const [liveStream, setLiveStream] = useState(null)
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

  // Poll only telemetry from the two background workers. Video capture and YOLO
  // inference remain resident in the Python service and never run in the UI.
  useEffect(() => {
    if (!liveStream?.id || !['queued', 'running'].includes(liveStream.status)) return undefined
    let cancelled = false
    const poll = async () => {
      try {
        const snapshot = await fetchLiveInspection(liveStream.id)
        if (!cancelled) setLiveStream(snapshot)
      } catch (err) {
        if (!cancelled) {
          setLiveStream((current) => current ? { ...current, status: 'failed', last_error: err.message } : current)
          showToast(err.message || 'Live detection connection was lost.', 'error')
        }
      }
    }
    poll()
    const timer = window.setInterval(poll, 1000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [liveStream?.id, liveStream?.status, showToast])

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
      setProgress({ percent: 20, label: 'Uploading Drone Flight Footage...' })
      await new Promise((r) => setTimeout(r, 300))
      setProgress({ percent: 55, label: 'Extracting Frames from Video...' })
      await new Promise((r) => setTimeout(r, 300))
      setProgress({ percent: 85, label: 'NMS Suppression & Severity Classification...' })

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
      () => 'Sample drone flight video loaded & analyzed!',
    )
  }

  async function handleRunVideoInspection() {
    if (selectedFiles.length === 0) return
    setIsProcessing(true)
    try {
      setProgress({ percent: 5, label: 'Uploading flight video...' })
      const started = await startVideoInspection({ files: selectedFiles, assetId: targetAssetId, model: selectedModel })
      const jobId = started.job.id
      let snapshot = started
      while (snapshot.job.status === 'queued' || snapshot.job.status === 'running') {
        setProgress({
          percent: Math.max(8, Math.min(99, snapshot.job.progress || 0)),
          label: snapshot.job.status === 'queued'
            ? 'Loading selected AI model...'
            : `Analyzing video frames — ${snapshot.job.detections_found || 0} detections`,
        })
        await new Promise((resolve) => setTimeout(resolve, 1000))
        snapshot = await fetchVideoInspection(jobId)
      }
      if (snapshot.job.status === 'failed') throw new Error(snapshot.job.error || 'Video inspection failed.')
      setProgress({ percent: 100, label: 'Video inspection complete!' })
      await loadMissions()
      await loadAssets()
      showToast(`Inspection complete: ${snapshot.job.detections_found || 0} detections in ${snapshot.job.processed_frames || 0} sampled frames.`, 'success')
      setSelectedFiles([])
      if (snapshot.mission) openReview({ ...snapshot.mission, images: snapshot.results || [] })
    } catch (err) {
      console.error('Video inspection error:', err)
      showToast(err.message || 'Failed to complete video inspection.', 'error')
    } finally {
      setIsProcessing(false)
      setProgress(null)
    }
  }

  async function handleStartLiveDetection() {
    try {
      const stream = await startLiveInspection({ source: liveSource, model: liveModel, inferenceFps: 3 })
      setLiveStream(stream)
      showToast('Live detection started. New potholes and bridge defects will be written to detections.json.', 'success')
    } catch (err) {
      showToast(err.message || 'Could not start live detection.', 'error')
    }
  }

  async function handleStopLiveDetection() {
    if (!liveStream?.id) return
    try {
      const stream = await stopLiveInspection(liveStream.id)
      setLiveStream(stream)
      showToast('Live detection stopped. Existing events remain stored.', 'success')
    } catch (err) {
      showToast(err.message || 'Could not stop live detection.', 'error')
    }
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

  const fleetStats = getFleetStats(missions)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_TILES.map((tile) => (
          <div
            key={tile.key}
            className="flex items-center gap-3 rounded-md border border-border bg-bg-card px-4 py-3 shadow-card-sm"
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-bg-input text-sm ${tile.tone}`}>
              <i className={`fa-solid ${tile.icon}`} />
            </span>
            <div className="min-w-0">
              <div className={`font-mono text-lg font-bold leading-none ${tile.tone}`}>
                {fleetStats[tile.key]}
              </div>
              <div className="mt-1 truncate text-[11px] font-medium text-text-muted">{tile.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
      <UploadPanel
        assets={assets}
        targetAssetId={targetAssetId}
        onTargetAssetChange={(id) => {
          setTargetAssetId(id)
          if (id) setSearchParams({ assetId: id }, { replace: true })
        }}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        liveSource={liveSource}
        onLiveSourceChange={setLiveSource}
        liveModel={liveModel}
        onLiveModelChange={setLiveModel}
        liveStream={liveStream}
        onStartLive={handleStartLiveDetection}
        onStopLive={handleStopLiveDetection}
        selectedFiles={selectedFiles}
        onFilesSelected={setSelectedFiles}
        onRunInspection={handleRunVideoInspection}
        onLoadSampleDataset={handleLoadSampleDataset}
        isProcessing={isProcessing}
        progress={progress}
      />

      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
              <i className="fa-solid fa-satellite-dish text-accent-blue" /> Survey Log
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
