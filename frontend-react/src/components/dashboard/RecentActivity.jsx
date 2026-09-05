import EmptyState from '../ui/EmptyState.jsx'

const TYPE_ICONS = {
  inspection: 'fa-satellite-dish',
  work_order: 'fa-helmet-safety',
  review: 'fa-robot',
  report: 'fa-file-signature',
}

// Legacy severity strings ('High' | 'Medium' | 'Low' | 'Critical') mapped to
// a left-border accent color on each activity row.
const SEVERITY_BORDER = {
  critical: 'border-l-p1',
  high: 'border-l-p1',
  medium: 'border-l-p2',
  low: 'border-l-p3',
}

export default function RecentActivity({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-clipboard-check"
        title="No municipal activity recorded yet."
        message="Upload aerial imagery or register an asset to begin."
      />
    )
  }

  return (
    <div className="flex max-h-[460px] flex-col gap-3 overflow-y-auto">
      {activities.map((act) => {
        const borderClass = SEVERITY_BORDER[(act.severity || 'low').toLowerCase()] || 'border-l-accent-blue'
        return (
          <div
            key={act.id}
            className={`flex items-start gap-3 rounded-sm border border-border/70 border-l-[3px] bg-[#0e121a] p-3 shadow-card-sm transition-colors duration-150 hover:border-border-light hover:bg-[#131824] ${borderClass}`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-[#161c28] text-[12px] text-accent-blue">
              <i className={`fa-solid ${TYPE_ICONS[act.type] || 'fa-file-signature'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-[13px] font-semibold text-text-primary">{act.title}</h4>
              <p className="my-0.5 flex items-center gap-1.5 truncate font-mono text-[11px] text-text-muted">
                <i className="fa-solid fa-map-pin text-accent-blue text-[10px]" /> {act.asset}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-text-secondary">
                <span className="flex items-center gap-1 text-slate-400">
                  <i className="fa-solid fa-user-shield text-[10px] text-slate-500" /> {act.user}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10.5px] text-slate-400">
                  <i className="fa-regular fa-clock text-[10px] text-slate-500" /> {act.time}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
