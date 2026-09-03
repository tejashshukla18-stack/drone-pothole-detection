const PRIORITY_TONE = {
  P1: "bg-p1/15 text-p1 border-p1/30",
  P2: "bg-p2/15 text-p2 border-p2/30",
  P3: "bg-p3/15 text-p3 border-p3/30",
};

function priorityKey(priority) {
  if (priority?.includes("P1")) return "P1";
  if (priority?.includes("P3")) return "P3";
  return "P2";
}

export default function WorkOrderCard({ workOrder }) {
  const key = priorityKey(workOrder.priority);
  const progress = workOrder.progress_percent || 0;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${PRIORITY_TONE[key]}`}
        >
          {workOrder.priority}
        </span>
        <span className="text-[11px] font-bold text-text-muted">
          {workOrder.id}
        </span>
      </div>

      <h4 className="text-[14px] font-bold leading-snug text-text-primary">
        {workOrder.title}
      </h4>
      <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
        <i className="fa-solid fa-map-pin text-accent-blue" />{" "}
        {workOrder.asset_name}
      </div>

      <div className="flex flex-col gap-1.5 rounded-sm border border-border-light bg-bg-surface px-3 py-2.5 text-[12px] text-text-secondary">
        <div>
          <strong className="text-text-primary">Contractor:</strong>{" "}
          {workOrder.contractor}
        </div>
        <div>
          <strong className="text-text-primary">Target Deadline:</strong>{" "}
          {workOrder.deadline}
        </div>
        <div>
          <strong className="text-text-primary">Estimated Cost:</strong> $
          {(workOrder.estimated_cost || 0).toLocaleString()}
        </div>
        <div>
          <strong className="text-text-primary">Method:</strong>{" "}
          {workOrder.repair_method}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-text-muted">
          <span>Progress ({workOrder.status})</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-surface">
          <div
            className="h-full rounded-full bg-accent-blue transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
