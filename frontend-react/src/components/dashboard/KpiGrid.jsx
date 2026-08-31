const ICON_TONES = {
  blue: 'bg-accent-blue/15 text-accent-blue',
  teal: 'bg-accent-teal/15 text-accent-teal',
  red: 'bg-p1/15 text-p1',
  green: 'bg-p3/15 text-p3',
}

const TREND_TONES = {
  positive: 'text-p3',
  neutral: 'text-accent-teal',
  negative: 'text-p1',
}

function KpiCard({ icon, tone, label, value, unit, trendIcon, trendTone, trendLabel, alert }) {
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
        <h3 className={`my-0.5 text-2xl font-bold ${alert ? 'text-p1' : 'text-text-primary'}`}>
          {value}
          {unit && <span className="ml-0.5 text-sm font-normal text-text-muted">{unit}</span>}
        </h3>
        <span className={`flex items-center gap-1 text-[11px] font-semibold ${TREND_TONES[trendTone]}`}>
          <i className={`fa-solid ${trendIcon}`} /> {trendLabel}
        </span>
      </div>
    </div>
  )
}

export default function KpiGrid({ kpis }) {
  return (
    <div className="mb-4.5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon="fa-road"
        tone="blue"
        label="Total Managed Assets"
        value={kpis.total_assets}
        trendIcon="fa-arrow-up"
        trendTone="positive"
        trendLabel="Municipal road network"
      />
      <KpiCard
        icon="fa-drone"
        tone="teal"
        label="Completed Inspections"
        value={kpis.total_inspections}
        trendIcon="fa-check"
        trendTone="neutral"
        trendLabel="100% telemetry synced"
      />
      <KpiCard
        icon="fa-triangle-exclamation"
        tone="red"
        label="Critical Defects (P1)"
        value={kpis.critical_defects}
        trendIcon="fa-bolt"
        trendTone="negative"
        trendLabel="Immediate repair needed"
        alert
      />
      <KpiCard
        icon="fa-heart-pulse"
        tone="green"
        label="Infrastructure Health"
        value={kpis.health_score}
        unit="/100"
        trendIcon="fa-circle-check"
        trendTone="positive"
        trendLabel="Municipal fair tier"
      />
    </div>
  )
}
