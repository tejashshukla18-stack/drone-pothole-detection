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
        className="inline-flex items-center gap-1.5 rounded-sm bg-[#0f172a] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1e293b]"
      >
        <i className="fa-solid fa-satellite" /> Start Drone Mission
      </button>

      <button
        type="button"
        onClick={onLoadSample}
        className="inline-flex items-center gap-1.5 rounded-sm bg-[#0f172a] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1e293b]"
      >
        <i className="fa-solid fa-folder-open" /> 1-Click Load Sample Dataset
      </button>

      <button
        type="button"
        onClick={onRegisterAsset}
        className="inline-flex items-center gap-1.5 rounded-sm bg-[#0f172a] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1e293b]"
      >
        <i className="fa-solid fa-plus" /> Register Asset
      </button>

      <button
        type="button"
        onClick={onDispatchWorkOrder}
        className="inline-flex items-center gap-1.5 rounded-sm bg-[#0f172a] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1e293b]"
      >
        <i className="fa-solid fa-helmet-safety" /> Dispatch Work Order
      </button>
    </div>
  )
}
