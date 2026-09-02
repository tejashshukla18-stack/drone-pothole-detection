import { useEffect, useRef, useState } from 'react'

function formatFileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatDuration(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// Video files don't carry duration as a plain property like images carry
// dimensions - it has to be read by loading metadata into a hidden <video>.
function useVideoDurations(files) {
  const [durations, setDurations] = useState({})

  useEffect(() => {
    let cancelled = false
    files.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`
      if (durations[key] !== undefined) return
      const url = URL.createObjectURL(file)
      const videoEl = document.createElement('video')
      videoEl.preload = 'metadata'
      videoEl.src = url
      videoEl.onloadedmetadata = () => {
        if (!cancelled) {
          setDurations((prev) => ({ ...prev, [key]: videoEl.duration }))
        }
        URL.revokeObjectURL(url)
      }
      videoEl.onerror = () => {
        if (!cancelled) setDurations((prev) => ({ ...prev, [key]: null }))
        URL.revokeObjectURL(url)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files])

  return (file) => durations[`${file.name}-${file.size}-${file.lastModified}`]
}

const PIPELINE_STAGES = ['Upload', 'Extract Frames', 'Detect', 'Classify']

function stageIndexForPercent(percent) {
  if (percent >= 100) return 4
  if (percent >= 75) return 3
  if (percent >= 45) return 2
  if (percent >= 15) return 1
  return 0
}

export default function UploadPanel({
  assets,
  targetAssetId,
  onTargetAssetChange,
  selectedFiles,
  onFilesSelected,
  onRunInspection,
  onLoadSampleDataset,
  isProcessing,
  progress,
}) {
  const [isDragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const getDuration = useVideoDurations(selectedFiles)

  function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, 5)
    onFilesSelected(files)
  }

  const totalQueueBytes = selectedFiles.reduce((sum, f) => sum + f.size, 0)
  const activeStage = progress ? stageIndexForPercent(progress.percent) : -1

  return (
    <div className="flex flex-col gap-4">
      {/* Ingestion Console */}
      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
              <i className="fa-solid fa-cloud-arrow-up text-accent-blue" /> Mission Ingestion
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">Drop aerial flight video for CV analysis</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent-teal/25 bg-accent-teal/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-accent-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-teal" />
            CV Engine Online
          </span>
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="selectMissionAsset" className="text-xs font-semibold text-text-secondary">
            <i className="fa-solid fa-location-dot text-text-muted" /> Target Asset
          </label>
          <select
            id="selectMissionAsset"
            value={targetAssetId}
            onChange={(e) => onTargetAssetChange(e.target.value)}
            className="w-full rounded-sm border border-border bg-bg-input px-3 py-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          >
            <option value="">Select asset to inspect...</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.code})
              </option>
            ))}
          </select>
        </div>

        {/* Viewfinder dropzone: corner brackets + faint survey grid, echoing an
            aerial capture frame rather than a generic dashed upload box. */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
          }}
          style={{ backgroundImage: 'url(/map-pattern.svg)', backgroundSize: '120px 120px' }}
          className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-md border px-4 py-9 text-center transition-colors ${
            isDragOver ? 'border-accent-blue bg-accent-blue/5' : 'border-border bg-bg-input/60 hover:bg-bg-input'
          }`}
        >
          {/* corner reticle marks */}
          {[
            'left-2 top-2 border-l-2 border-t-2',
            'right-2 top-2 border-r-2 border-t-2',
            'left-2 bottom-2 border-l-2 border-b-2',
            'right-2 bottom-2 border-r-2 border-b-2',
          ].map((pos) => (
            <span
              key={pos}
              className={`pointer-events-none absolute h-4 w-4 rounded-[2px] ${pos} ${
                isDragOver ? 'border-accent-blue' : 'border-border-light'
              }`}
            />
          ))}

          <i className="fa-solid fa-video mb-1 text-3xl text-accent-blue/70" />
          <h4 className="text-sm font-bold text-text-primary">Drag &amp; drop drone flight video here</h4>
          <p className="text-xs text-text-muted">MP4, MOV, AVI up to 2GB per file &middot; max 5 videos</p>
          <span className="text-xs font-semibold text-accent-blue underline underline-offset-2">
            or browse local files
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files.length > 0) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
          <span>Fast testing:</span>
          <button
            type="button"
            onClick={onLoadSampleDataset}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-3 py-1.5 text-xs font-semibold text-accent-teal transition-colors hover:bg-accent-teal/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-clapperboard" /> Load sample flight video
          </button>
        </div>

        {progress && (
          <div className="mt-4 flex flex-col gap-3 rounded-sm border border-border bg-bg-input p-3">
            <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-gear fa-spin text-accent-blue" /> {progress.label}
              </span>
              <span className="font-mono">{progress.percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent-blue transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            {/* Pipeline stepper: this genuinely is a sequence (upload -> extract
                frames -> detect -> classify), so ordering here is informative. */}
            <div className="flex items-center">
              {PIPELINE_STAGES.map((stage, idx) => (
                <div key={stage} className="flex flex-1 items-center last:flex-initial">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                        idx < activeStage
                          ? 'bg-accent-blue text-white'
                          : idx === activeStage
                            ? 'bg-accent-blue/15 text-accent-blue ring-2 ring-accent-blue/30'
                            : 'bg-border text-text-muted'
                      }`}
                    >
                      {idx < activeStage ? <i className="fa-solid fa-check text-[9px]" /> : idx + 1}
                    </span>
                    <span
                      className={`whitespace-nowrap text-[11px] font-semibold ${
                        idx <= activeStage ? 'text-text-primary' : 'text-text-muted'
                      }`}
                    >
                      {stage}
                    </span>
                  </div>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div
                      className={`mx-2 h-px flex-1 ${idx < activeStage ? 'bg-accent-blue' : 'bg-border'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onRunInspection}
          disabled={selectedFiles.length === 0 || isProcessing}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-accent-blue px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-bolt" />}
          Run Computer Vision Inspection
        </button>
      </div>

      {/* Manifest */}
      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-list-check text-accent-blue" /> Video Manifest
          </h3>
          <span className="rounded-full bg-border px-2.5 py-1 font-mono text-[11px] font-bold text-text-secondary">
            {selectedFiles.length} queued
          </span>
        </div>

        {selectedFiles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-text-muted">
            <i className="fa-solid fa-video text-2xl opacity-50" />
            <p className="text-xs">No video files queued. Upload footage or load a sample mission.</p>
          </div>
        ) : (
          <>
            <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2.5 rounded-sm bg-bg-input px-3 py-2 text-xs"
                >
                  <span className="w-5 shrink-0 text-right font-mono text-[10px] text-text-muted">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <i className="fa-solid fa-file-video shrink-0 text-accent-blue" />
                  <span className="min-w-0 flex-1 truncate font-medium text-text-primary">{file.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-text-muted">
                    {formatDuration(getDuration(file))}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-text-muted">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5 text-[11px] text-text-muted">
              <span>Total payload</span>
              <span className="font-mono font-semibold text-text-secondary">
                {formatFileSize(totalQueueBytes)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}