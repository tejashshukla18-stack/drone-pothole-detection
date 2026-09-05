export default function ReportsList({ reports, selectedId, onSelect }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center text-text-muted">
        <i className="fa-solid fa-file-circle-exclamation mb-2.5 block text-3xl opacity-40" />
        <strong className="mb-1 block text-text-primary">No Reports Generated</strong>
        <p className="text-[12px]">
          Run an inspection mission to compile and certify official engineering dossiers.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {reports.map((r) => {
        const isActive = r.id === selectedId
        const isCritical = r.overall_condition === 'Critical'
        return (
          <button
            type="button"
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={`rounded-md border px-3.5 py-3 text-left transition-colors ${
              isActive
                ? 'border-accent-blue bg-accent-blue/5'
                : 'border-border bg-bg-surface hover:bg-bg-card-hover'
            }`}
          >
            <h4 className="flex items-center gap-2 text-[13px] font-bold leading-snug text-text-primary">
              <i className="fa-solid fa-file-pdf text-accent-blue" /> {r.title}
            </h4>
            <p className="mt-1 text-[11px] text-text-muted">
              {r.report_number} &bull; {r.generated_date}
            </p>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span
                className={`rounded-full px-2 py-0.5 font-bold ${
                  isCritical ? 'bg-p1/15 text-p1' : 'bg-p2/15 text-p2'
                }`}
              >
                {r.overall_condition}
              </span>
              <span className="font-semibold text-accent-blue">
                ${(r.total_rehabilitation_cost || 0).toLocaleString()}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
