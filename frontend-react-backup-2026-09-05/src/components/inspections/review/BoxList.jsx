import {
  formatDefectLabel,
  getConfidenceNumber,
  getConfidenceTone,
} from '../inspectionHelpers.js'

function iconForLabel(label) {
  const lower = label.toLowerCase()
  if (lower.includes('crack') || lower.includes('fissure')) {
    return <i className="fa-solid fa-code-branch text-p2" />
  }
  if (lower.includes('spall') || lower.includes('breakout')) {
    return <i className="fa-solid fa-cube text-accent-blue" />
  }
  return <i className="fa-solid fa-circle-dot text-p1" />
}

export default function BoxList({ boxes, selectedBoxId, onSelect, onDelete }) {
  if (!boxes || boxes.length === 0) {
    return <p className="text-xs text-text-muted">No defect boxes on this frame.</p>
  }

  return (
    <div className="flex flex-col gap-1.5">
      {boxes.map((box, idx) => {
        const displayLabel = formatDefectLabel(box, idx)
        const confNum = getConfidenceNumber(box)
        const areaStr = box.area_cm2 ? `~${box.area_cm2}cm²` : `${box.width}×${box.height}px`
        const boxId = box.id || idx

        return (
          <div
            key={boxId}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(boxId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(boxId)
            }}
            className={`flex cursor-pointer items-center justify-between rounded-sm border px-3 py-2 text-xs transition-colors ${
              boxId === selectedBoxId
                ? 'border-accent-blue bg-accent-blue/5'
                : 'border-transparent bg-bg-input hover:border-border-light'
            }`}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              {iconForLabel(displayLabel)}
              <strong className="truncate text-text-primary">{displayLabel}</strong>
              <span className="shrink-0 text-[11px] text-text-muted">
                [{box.width}×{box.height}px • {areaStr}]
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${getConfidenceTone(confNum)}`}>
                {box.confidence || `${confNum}%`}
              </span>
              <button
                type="button"
                title="Remove defect box"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(boxId)
                }}
                className="text-text-muted transition-colors hover:text-p1"
              >
                <i className="fa-solid fa-trash-can" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
