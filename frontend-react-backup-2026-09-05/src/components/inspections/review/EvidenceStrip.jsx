const MODES = [
  { key: 'original', label: 'Original Frame', showBoxes: false, showLabels: false },
  { key: 'detection', label: 'AI Detection', showBoxes: true, showLabels: false },
  { key: 'annotated', label: 'Annotated Evidence', showBoxes: true, showLabels: true },
]

function BoxOverlay({ boxes, imageDims, showLabels }) {
  if (!imageDims) return null
  return (
    <svg
      viewBox={`0 0 ${imageDims.width} ${imageDims.height}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {boxes.map((box, idx) => {
        const isRejected = box.status === 'Rejected'
        const stroke = isRejected ? '#94a3b8' : '#22c55e'
        return (
          <g key={box.id || idx}>
            <rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              fill="none"
              stroke={stroke}
              strokeWidth={Math.max(2, imageDims.width / 300)}
            />
            {showLabels && (
              <text
                x={box.x + 4}
                y={box.y > 20 ? box.y - 6 : box.y + 18}
                fill={stroke}
                fontSize={Math.max(14, imageDims.width / 45)}
                fontWeight="bold"
                stroke="black"
                strokeWidth="0.5"
              >
                {box.confidence || '85%'}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function EvidenceStrip({ imageUrl, boxes, imageDims }) {
  return (
    <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-text-primary">
        <i className="fa-solid fa-images text-accent-blue" /> Evidence
      </h3>

      {!imageUrl ? (
        <p className="py-6 text-center text-xs text-text-muted">No frame loaded to build evidence views from.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODES.map((mode) => (
            <div key={mode.key} className="overflow-hidden rounded-sm border border-border">
              <div className="relative aspect-video bg-slate-100">
                <img src={imageUrl} alt={mode.label} className="h-full w-full object-cover" />
                {mode.showBoxes && (
                  <BoxOverlay boxes={boxes || []} imageDims={imageDims} showLabels={mode.showLabels} />
                )}
              </div>
              <div className="border-t border-border bg-bg-input px-2.5 py-1.5 text-center text-[11px] font-semibold text-text-secondary">
                {mode.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}