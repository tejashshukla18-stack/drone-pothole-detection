// Reusable risk badge for the Land Intelligence module.
// Levels: HIGH, MEDIUM, LOW, CLEAR — matches the Encroachment Map legend
// (Red / Orange / Yellow / Green). Accepts any case ("High", "high", "HIGH").

const LEVEL_CONFIG = {
  HIGH: { label: 'HIGH', classes: 'bg-p1/15 text-p1', dot: 'bg-p1' },
  MEDIUM: { label: 'MEDIUM', classes: 'bg-p2/15 text-p2', dot: 'bg-p2' },
  LOW: { label: 'LOW', classes: 'bg-yellow-500/15 text-yellow-600', dot: 'bg-yellow-500' },
  CLEAR: { label: 'CLEAR', classes: 'bg-p3/15 text-p3', dot: 'bg-p3' },
}

export default function RiskBadge({ level, showDot = true, className = '' }) {
  const key = String(level || 'LOW').toUpperCase()
  const cfg = LEVEL_CONFIG[key] || LEVEL_CONFIG.LOW

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.classes} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  )
}

export { LEVEL_CONFIG as RISK_BADGE_LEVEL_CONFIG }
