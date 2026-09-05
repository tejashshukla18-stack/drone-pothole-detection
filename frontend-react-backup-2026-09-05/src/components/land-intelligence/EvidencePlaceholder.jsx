// Professional-looking aerial-imagery placeholders rendered as inline SVG.
// These never hit the network, so there is no possibility of a broken image
// — used for Original Drone Image / AI Detection / Boundary Overlay /
// Previous vs Current survey comparisons across the Land Case workflow.

const VARIANT_LABELS = {
  original: 'Original Drone Image',
  ai_detection: 'AI Detection',
  boundary_overlay: 'Boundary Overlay',
}

function AerialBase({ seed = 0 }) {
  // Deterministic patchwork of "field" rectangles so every parcel's
  // placeholder looks slightly different without being random per render.
  const rects = Array.from({ length: 8 }, (_, i) => {
    const x = (i * 47 + seed * 13) % 300
    const y = (i * 83 + seed * 29) % 180
    const w = 40 + ((i * 17 + seed) % 60)
    const h = 30 + ((i * 23 + seed) % 40)
    const shades = ['#3f6b3a', '#4d7a45', '#6b8f4e', '#5a7a3f', '#345c30']
    return { x, y, w, h, fill: shades[i % shades.length] }
  })

  return (
    <>
      <rect width="300" height="180" fill="#2e4d2a" />
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} opacity="0.85" />
      ))}
      <line x1="0" y1="90" x2="300" y2="95" stroke="#8a8a6f" strokeWidth="2" opacity="0.5" />
    </>
  )
}

export default function EvidencePlaceholder({ variant = 'original', caseId = '', className = '' }) {
  const seed = Array.from(String(caseId)).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)

  return (
    <div
      className={`relative aspect-[5/3] w-full overflow-hidden rounded-md border border-border bg-slate-800 ${className}`}
    >
      <svg viewBox="0 0 300 180" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <AerialBase seed={seed} />

        {variant === 'ai_detection' && (
          <>
            <polygon
              points="150,40 220,70 205,140 120,150 95,90"
              fill="rgba(239,68,68,0.18)"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="6 3"
            />
            <rect x="150" y="30" width="86" height="16" fill="#ef4444" />
            <text x="153" y="41" fontSize="9" fill="#fff" fontFamily="sans-serif" fontWeight="700">
              AI DETECTED
            </text>
          </>
        )}

        {variant === 'boundary_overlay' && (
          <>
            <polygon
              points="60,40 240,40 240,150 60,150"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
            <polygon
              points="60,40 250,55 245,160 55,150"
              fill="rgba(239,68,68,0.12)"
              stroke="#ef4444"
              strokeWidth="2.5"
              strokeDasharray="5 3"
            />
          </>
        )}

        <rect x="0" y="158" width="300" height="22" fill="rgba(15,23,42,0.65)" />
        <text x="8" y="173" fontSize="9" fill="#e2e8f0" fontFamily="sans-serif">
          {VARIANT_LABELS[variant] || 'Aerial Imagery'} &bull; Synthetic Demo Imagery
        </text>
      </svg>

      {variant === 'boundary_overlay' && (
        <div className="absolute left-2 top-2 flex flex-col gap-1 rounded-sm bg-black/50 px-2 py-1.5 text-[10px] font-semibold text-white">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-blue" /> Authorized Boundary
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-p1" /> Detected Boundary
          </span>
        </div>
      )}
    </div>
  )
}
