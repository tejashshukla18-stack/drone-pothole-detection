export default function QuickActionsBar({
  onStartInspection,
  onLoadSample,
  onRegisterAsset,
  onDispatchWorkOrder,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-bg-surface px-4.5 py-3 shadow-card-sm">
      <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted">
        <i className="fa-solid fa-bolt text-accent-blue" /> Tactical Actions:
      </span>

      <button
        type="button"
        onClick={onStartInspection}
        className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_0_12px_rgba(224,122,56,0.2)] transition-all duration-150 hover:bg-accent-blue-hover active:scale-[0.98]"
      >
        <i className="fa-solid fa-satellite text-xs" /> Start Drone Mission
      </button>

      <button
        type="button"
        onClick={onLoadSample}
        className="inline-flex items-center gap-2 rounded-sm border border-[#232c3d] bg-[#161d2b] px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-all duration-150 hover:border-slate-600 hover:bg-[#1f283b] hover:text-white active:scale-[0.98]"
      >
        <i className="fa-solid fa-folder-open text-xs text-accent-blue" /> 1-Click Load Sample Dataset
      </button>

      <button
        type="button"
        onClick={onRegisterAsset}
        className="inline-flex items-center gap-2 rounded-sm border border-[#232c3d] bg-[#161d2b] px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-all duration-150 hover:border-slate-600 hover:bg-[#1f283b] hover:text-white active:scale-[0.98]"
      >
        <i className="fa-solid fa-plus text-xs text-slate-400" /> Register Asset
      </button>

      <button
        type="button"
        onClick={onDispatchWorkOrder}
        className="inline-flex items-center gap-2 rounded-sm border border-[#232c3d] bg-[#161d2b] px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-all duration-150 hover:border-slate-600 hover:bg-[#1f283b] hover:text-white active:scale-[0.98]"
      >
        <i className="fa-solid fa-helmet-safety text-xs text-amber-400" /> Dispatch Work Order
      </button>
    </div>
  )
}
