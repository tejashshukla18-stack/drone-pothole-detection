const ICON_TONES = {
  blue: 'bg-slate-100 text-slate-500',
  teal: 'bg-slate-100 text-slate-500',
  red: 'bg-slate-100 text-slate-500',
  green: 'bg-slate-100 text-slate-500',
}

function KpiCard({ icon, tone, label, value, unit, alert, illustration, illustrationAlt }) {
  return (
    <div
      className={`relative flex h-[150px] flex-col overflow-hidden rounded-md border bg-bg-card p-4 shadow-card-sm transition-transform hover:-translate-y-0.5 hover:border-border-light ${
        alert ? 'border-p1/30' : 'border-border'
      }`}
    >
      <div className="relative z-10 flex items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[13px] ${ICON_TONES[tone]}`}>
          <i className={`fa-solid ${icon}`} />
        </div>
        <span className="text-[12.5px] font-semibold text-text-muted">{label}</span>
      </div>

      <h3 className={`relative z-10 mt-3 text-[26px] font-bold leading-none ${alert ? 'text-p1' : 'text-text-primary'}`}>
        {value}
        {unit && <span className="ml-0.5 text-sm font-normal text-text-muted">{unit}</span>}
      </h3>

      {illustration && (
        <img
          src={illustration}
          alt={illustrationAlt || ''}
          aria-hidden={!illustrationAlt}
          className="pointer-events-none absolute -bottom-3 -right-4 h-[128px] w-[176px] object-contain opacity-95"
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
