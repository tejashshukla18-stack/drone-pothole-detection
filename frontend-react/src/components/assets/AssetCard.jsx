import {
  getAssetImages,
  getHealthDisplay,
  getStatusTone,
  STATUS_BADGE_CLASSES,
} from './assetStatus.js'

export default function AssetCard({ asset, onOpen, onInspect }) {
  const images = getAssetImages(asset)
  const hasImage = images.length > 0
  const mainImage = hasImage ? images[0] : null
  const tone = getStatusTone(asset)
  const healthDisplay = getHealthDisplay(asset)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(asset.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(asset.id)
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-md border border-border bg-bg-card shadow-card-sm transition-all hover:-translate-y-0.5 hover:shadow-card-md"
    >
      {hasImage ? (
        <div className="relative h-40 w-full overflow-hidden bg-bg-input">
          <img
            src={mainImage}
            alt={asset.name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            {asset.type}
          </span>
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_BADGE_CLASSES[tone]}`}
          >
            {healthDisplay}
          </span>
          {images.length > 1 && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
              <i className="fa-solid fa-images" /> {images.length} Drone Plates
            </span>
          )}
        </div>
      ) : (
        <div className="relative flex h-40 w-full flex-col items-center justify-center gap-1.5 bg-bg-input text-text-muted">
          <i className="fa-solid fa-camera-retro text-2xl opacity-50" />
          <span className="text-xs font-semibold text-text-secondary">No Inspection Imagery</span>
          <small className="text-[11px]">Click to add drone footage</small>
          <span className="absolute left-2 top-2 rounded-full bg-border px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
            {asset.type}
          </span>
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_BADGE_CLASSES.uninspected}`}
          >
            {healthDisplay}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h4 className="truncate text-sm font-bold text-text-primary">{asset.name}</h4>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            <i className="fa-solid fa-barcode" /> {asset.code} • {asset.district}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-sm bg-bg-input px-2.5 py-2">
            <span className="block text-[10px] text-text-muted">Defects Logged:</span>
            <strong
              className={`text-[13px] ${
                asset.total_defects > 3
                  ? 'text-p1'
                  : asset.total_defects > 0
                    ? 'text-p2'
                    : 'text-text-primary'
              }`}
            >
              {asset.total_defects} Cavities
            </strong>
          </div>
          <div className="rounded-sm bg-bg-input px-2.5 py-2">
            <span className="block text-[10px] text-text-muted">Last Inspected:</span>
            <strong className="text-[13px] text-text-primary">{asset.last_inspection}</strong>
          </div>
          <div className="rounded-sm bg-bg-input px-2.5 py-2">
            <span className="block text-[10px] text-text-muted">Pavement Length:</span>
            <strong className="text-[13px] text-text-primary">
              {asset.length_km ? `${asset.length_km} km` : 'N/A'}
            </strong>
          </div>
          <div className="rounded-sm bg-bg-input px-2.5 py-2">
            <span className="block text-[10px] text-text-muted">Est. Repair Cost:</span>
            <strong className="text-[13px] text-p2">
              ${asset.repair_budget_estimate ? asset.repair_budget_estimate.toLocaleString() : '0'}
            </strong>
          </div>
        </div>

        {!hasImage && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onInspect(asset.id)
            }}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-sm border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-xs font-semibold text-accent-blue transition-colors hover:bg-accent-blue/20"
          >
            <i className="fa-solid fa-plane-departure" /> Inspect with Drone
          </button>
        )}
      </div>
    </div>
  )
}
