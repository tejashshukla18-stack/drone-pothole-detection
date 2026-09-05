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
            className={`flex gap-3 rounded-sm border-l-[3px] bg-bg-surface p-3 ${borderClass}`}
          >
            <div className="mt-0.5 text-[15px] text-text-secondary">
              <i className={`fa-solid ${TYPE_ICONS[act.type] || 'fa-file-signature'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-[13px] font-semibold text-text-primary">{act.title}</h4>
              <p className="my-0.5 truncate text-xs text-text-muted">
                <i className="fa-solid fa-map-pin" /> {act.asset}
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] text-text-secondary">
                <span>
                  <i className="fa-solid fa-user" /> {act.user}
                </span>
                <span>
                  <i className="fa-regular fa-clock" /> {act.time}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
