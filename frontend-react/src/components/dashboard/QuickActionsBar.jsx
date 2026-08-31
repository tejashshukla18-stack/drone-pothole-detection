export default function QuickActionsBar({
  onStartInspection,
  onLoadSample,
  onRegisterAsset,
  onDispatchWorkOrder,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-border bg-bg-surface px-4.5 py-3">
      <span className="flex items-center gap-1.5 text-[13px] font-bold text-text-secondary">
        <i className="fa-solid fa-bolt" /> Quick Actions:
      </span>

      <button
        type="button"
        onClick={onStartInspection}
        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-card px-3.5 py-2 text-[13px] font-medium text-text-primary transition-colors hover:border-accent-blue hover:bg-accent-blue hover:text-white"
      >
        <i className="fa-solid fa-satellite" /> Start Drone Mission
      </button>

      <button
        type="button"
        onClick={onLoadSample}
        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-card px-3.5 py-2 text-[13px] font-medium text-text-primary transition-colors hover:border-accent-blue hover:bg-accent-blue hover:text-white"
      >
        <i className="fa-solid fa-folder-open" /> 1-Click Load Sample Dataset
      </button>

      <button
        type="button"
        onClick={onRegisterAsset}
        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-card px-3.5 py-2 text-[13px] font-medium text-text-primary transition-colors hover:border-accent-blue hover:bg-accent-blue hover:text-white"
      >
        <i className="fa-solid fa-plus" /> Register Asset
      </button>

      <button
        type="button"
        onClick={onDispatchWorkOrder}
        className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-bg-card px-3.5 py-2 text-[13px] font-medium text-text-primary transition-colors hover:border-accent-blue hover:bg-accent-blue hover:text-white"
      >
        <i className="fa-solid fa-helmet-safety" /> Dispatch Work Order
      </button>
    </div>
  )
}
