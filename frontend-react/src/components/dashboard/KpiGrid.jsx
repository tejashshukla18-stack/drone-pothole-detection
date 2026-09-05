const ICON_TONES = {
  blue: 'bg-accent-blue/15 text-accent-blue border border-accent-blue/25',
  teal: 'bg-teal-500/15 text-teal-400 border border-teal-500/25',
  red: 'bg-red-500/15 text-red-400 border border-red-500/25',
  green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
}

function KpiCard({ icon, tone, label, value, unit, alert, illustration, illustrationAlt }) {
  return (
    <div
      className={`group relative flex h-[148px] flex-col overflow-hidden rounded-md border bg-bg-card p-4.5 shadow-card-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-light ${
        alert
          ? 'border-p1/40 shadow-[0_0_16px_rgba(239,68,68,0.12)]'
          : 'border-border hover:shadow-card-md'
      }`}
    >
      {/* Top HUD micro-bracket corner */}
      <div className="pointer-events-none absolute right-2 top-2 h-2 w-2 border-r border-t border-slate-700/60" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[12px] ${ICON_TONES[tone]}`}>
          <i className={`fa-solid ${icon}`} />
        </div>
      </div>

      <div className="relative z-10 mt-auto pb-1">
        <div className={`font-mono text-[28px] font-bold leading-none tracking-tight ${alert ? 'text-p1' : 'text-text-primary'}`}>
          {value ?? '—'}
          {unit && <span className="ml-1 text-sm font-normal text-text-muted">{unit}</span>}
        </div>
      </div>

      {illustration && (
        <img
          src={illustration}
          alt={illustrationAlt || ''}
          aria-hidden={!illustrationAlt}
          className="pointer-events-none absolute -bottom-3 -right-4 h-[120px] w-[160px] object-contain opacity-15 grayscale transition-opacity duration-200 group-hover:opacity-25"
        />
      )}
    </div>
  )
}

export default function KpiGrid({ kpis }) {
  return (
    <div className="mb-4.5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon="fa-binoculars"
        tone="blue"
        label="Total Managed Assets"
        value={kpis.total_assets}
        illustration="/kpi-road.svg"
      />
      <KpiCard
        icon="fa-clipboard-list"
        tone="teal"
        label="Completed Inspections"
        value={kpis.total_inspections}
        illustration="/kpi-drone.svg"
      />
      <KpiCard
        icon="fa-triangle-exclamation"
        tone="red"
        label="Critical Defects (P1)"
        value={kpis.critical_defects}
        alert
        illustration="/kpi-crack.svg"
      />
      <KpiCard
        icon="fa-heart-pulse"
        tone="green"
        label="Infrastructure Health"
        value={kpis.health_score}
        unit="/100"
        illustration="/kpi-health.svg"
      />
    </div>
  )
}
