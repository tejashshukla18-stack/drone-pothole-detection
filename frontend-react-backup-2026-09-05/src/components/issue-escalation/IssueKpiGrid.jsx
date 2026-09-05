const ICON_TONES = {
  blue: 'bg-accent-blue/15 text-accent-blue',
  red: 'bg-p1/15 text-p1',
  amber: 'bg-p2/15 text-p2',
  green: 'bg-p3/15 text-p3',
  teal: 'bg-accent-teal/15 text-accent-teal',
}

function KpiCard({ icon, tone, label, value, alert }) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-md border bg-bg-card p-4 shadow-card-sm transition-transform hover:-translate-y-0.5 hover:border-border-light ${
        alert ? 'border-p1/30' : 'border-border'
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-lg ${ICON_TONES[tone]}`}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <h3 className={`my-0.5 text-2xl font-bold ${alert ? 'text-p1' : 'text-text-primary'}`}>{value}</h3>
      </div>
    </div>
  )
}

// Summary tiles per the Issue Escalation spec: Critical, High Priority,
// Awaiting Response, In Progress, Resolved, Overdue.
export default function IssueKpiGrid({ kpis }) {
  return (
    <div className="mb-4.5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <KpiCard icon="fa-triangle-exclamation" tone="red" label="Critical" value={kpis.critical_issues ?? 0} alert />
      <KpiCard icon="fa-fire" tone="amber" label="High Priority" value={kpis.high_priority ?? 0} />
      <KpiCard icon="fa-hourglass-half" tone="amber" label="Awaiting Response" value={kpis.awaiting_response ?? 0} />
      <KpiCard icon="fa-helmet-safety" tone="teal" label="In Progress" value={kpis.in_progress ?? 0} />
      <KpiCard icon="fa-circle-check" tone="green" label="Resolved" value={kpis.resolved ?? 0} />
      <KpiCard icon="fa-clock" tone="red" label="Overdue" value={kpis.overdue ?? 0} alert={(kpis.overdue ?? 0) > 0} />
    </div>
  )
}
