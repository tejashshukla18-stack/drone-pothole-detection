function KpiCard({ icon, label, value, unit, tone = 'default' }) {
  const toneClasses = {
    default: 'text-slate-500',
    alert: 'text-p1',
    warning: 'text-p2',
    good: 'text-p3',
  }

  return (
    <div className="flex h-[110px] flex-col justify-between rounded-md border border-border bg-bg-card p-4 shadow-card-sm transition-transform hover:-translate-y-0.5 hover:border-border-light">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[13px] text-slate-500">
          <i className={`fa-solid ${icon}`} />
        </div>
        <span className="text-[12px] font-semibold leading-tight text-text-muted">{label}</span>
      </div>
      <h3 className={`text-[22px] font-bold leading-none ${toneClasses[tone]}`}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
        {unit && <span className="ml-0.5 text-xs font-normal text-text-muted">{unit}</span>}
      </h3>
    </div>
  )
}

export default function LandKpiGrid({ kpis }) {
  return (
    <div className="mb-4.5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon="fa-map" label="Parcels Analysed" value={kpis.parcelsAnalysed} />
      <KpiCard
        icon="fa-triangle-exclamation"
        label="Potential Encroachments"
        value={kpis.potentialEncroachments}
        tone="alert"
      />
      <KpiCard icon="fa-circle-exclamation" label="High Risk" value={kpis.highRisk} tone="alert" />
      <KpiCard icon="fa-circle-half-stroke" label="Medium Risk" value={kpis.mediumRisk} tone="warning" />
      <KpiCard icon="fa-circle-check" label="Low Risk" value={kpis.lowRisk} tone="good" />
      <KpiCard
        icon="fa-vector-square"
        label="Affected Area"
        value={kpis.affectedAreaSqm}
        unit="m²"
      />
      <KpiCard icon="fa-bolt" label="New Encroachments" value={kpis.newEncroachments} tone="warning" />
      <KpiCard icon="fa-stamp" label="Verified Cases" value={kpis.verifiedCases} tone="good" />
    </div>
  )
}
