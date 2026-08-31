import { useRef, useState } from 'react'

function formatFileSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
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

  function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, 50)
    onFilesSelected(files)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Upload Card */}
      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-cloud-arrow-up text-accent-blue" /> Upload Drone Imagery
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Drop high-res aerial photos or mission survey folders
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="selectMissionAsset" className="text-xs font-semibold text-text-secondary">
            <i className="fa-solid fa-map-pin" /> Target Asset:
          </label>
          <select
            id="selectMissionAsset"
            value={targetAssetId}
            onChange={(e) => onTargetAssetChange(e.target.value)}
            className="w-full rounded-sm border border-border bg-bg-input px-3 py-2 text-sm text-text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          >
            <option value="">Select Asset to Inspect...</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.code})
              </option>
            ))}
          </select>
        </div>

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
          className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors ${
            isDragOver
              ? 'border-accent-blue bg-accent-blue/5'
              : 'border-border-light bg-bg-input hover:border-accent-blue/50'
          }`}
        >
          <i className="fa-solid fa-helicopter mb-1 text-3xl text-accent-blue/70" />
          <h4 className="text-sm font-bold text-text-primary">Drag &amp; drop drone photos here</h4>
          <p className="text-xs text-text-muted">Supports JPG, PNG up to 50MB per frame (Max 50 images)</p>
          <span className="text-xs font-semibold text-accent-blue underline underline-offset-2">
            or Browse Local Files
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files.length > 0) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
          <span>Fast Testing:</span>
          <button
            type="button"
            onClick={onLoadSampleDataset}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-3 py-1.5 text-xs font-semibold text-accent-teal transition-colors hover:bg-accent-teal/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-images" /> Load 6 Flight Sample Frames
          </button>
        </div>

        {progress && (
          <div className="mt-4 flex flex-col gap-2 rounded-sm border border-border bg-bg-input p-3">
            <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-gear fa-spin text-accent-blue" /> {progress.label}
              </span>
              <span>{progress.percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent-blue transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['CLAHE Grayscale', 'Cavity BFS', 'Solidity Filter', 'NMS IoU'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold text-accent-blue"
                >
                  {tag}
                </span>
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
          {isProcessing ? (
            <i className="fa-solid fa-spinner fa-spin" />
          ) : (
            <i className="fa-solid fa-bolt" />
          )}
          Run Computer Vision Inspection
        </button>
      </div>

      {/* Inspection Queue */}
      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-list-check text-accent-blue" /> Image Processing Queue
          </h3>
          <span className="rounded-full bg-border px-2.5 py-1 text-[11px] font-bold text-text-secondary">
            {selectedFiles.length > 0 ? `${selectedFiles.length} frames queued` : '0 frames'}
          </span>
        </div>

        {selectedFiles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-text-muted">
            <i className="fa-solid fa-images text-2xl opacity-50" />
            <p className="text-xs">No images selected. Upload files or load sample mission.</p>
          </div>
        ) : (
          <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between rounded-sm bg-bg-input px-3 py-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2 truncate font-medium text-text-primary">
                  <i className="fa-solid fa-image text-accent-blue" />
                  <span className="truncate">{file.name}</span>
                </span>
                <span className="shrink-0 text-[11px] text-text-muted">{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
