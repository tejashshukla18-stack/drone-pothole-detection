import { useCallback, useEffect, useState } from "react";
import { fetchMaintenance } from "../../api/maintenance.js";
import { fetchAssets } from "../../api/assets.js";
import Spinner from "../ui/Spinner.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import WorkOrderCard from "./WorkOrderCard.jsx";
import CreateWorkOrderModal from "../inspections/review/CreateWorkOrderModal.jsx";
import MaintenanceEmptyPanel from "./MaintenanceEmptyPanel.jsx";
import CommandCentreMap from "./CommandCentreMap.jsx";

export default function MaintenanceTab() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isWorkOrderOpen, setWorkOrderOpen] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [orders, assetList] = await Promise.all([
        fetchMaintenance(),
        fetchAssets(),
      ]);
      setWorkOrders(orders);
      setAssets(assetList);
      setStatus("success");
    } catch (err) {
      console.error("Error fetching maintenance work orders:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return <Spinner label="Loading work orders..." />;
  }

  if (status === "error") {
    return (
      <ErrorState
        title="Unable to load maintenance data"
        message="Work orders could not be retrieved from the server."
        onRetry={load}
      />
    );
  }

  const p1Count = workOrders.filter((w) => w.priority?.includes("P1")).length;
  const p2Count = workOrders.filter((w) => w.priority?.includes("P2")).length;
  const p3Count = workOrders.filter((w) => w.priority?.includes("P3")).length;
  const totalCost = workOrders.reduce(
    (sum, w) => sum + (w.estimated_cost || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-text-primary">
            <i className="fa-solid fa-helmet-safety text-p1" /> Maintenance
            &amp; Work Order Management
          </h2>
          <p className="mt-1 text-[13px] text-text-muted">
            Track civil contractor dispatch, repair milestones, and pavement
            rehabilitation
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWorkOrderOpen(true)}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm bg-ink px-4 py-2 text-[13px] font-semibold text-white shadow-card-sm transition-colors hover:bg-ink-hover"
        >
          <i className="fa-solid fa-plus" /> Dispatch Work Order
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="fa-solid fa-fire"
          label="P1 - Immediate Repairs"
          value={`${p1Count} Order${p1Count === 1 ? "" : "s"}`}
        />
        <StatCard
          icon="fa-solid fa-calendar-check"
          label="P2 - Scheduled Maintenance"
          value={`${p2Count} Order${p2Count === 1 ? "" : "s"}`}
        />
        <StatCard
          icon="fa-solid fa-shield-halved"
          label="P3 - Routine Preventive"
          value={`${p3Count} Order${p3Count === 1 ? "" : "s"}`}
        />
        <StatCard
          icon="fa-solid fa-dollar-sign"
          label="Allocated Budget"
          value={`$${totalCost.toLocaleString()}`}
        />
      </div>

      <CommandCentreMap workOrders={workOrders} />

      {workOrders.length === 0 ? (
        <MaintenanceEmptyPanel
          icon="fa-solid fa-helmet-safety"
          title="No Active Work Orders"
          message="Dispatch rehabilitation and milling work orders to road maintenance contractors."
          action={
            <button
              type="button"
              onClick={() => setWorkOrderOpen(true)}
              className="inline-flex items-center gap-2 rounded-sm bg-ink px-5 py-2.5 text-[13px] font-semibold text-white shadow-card-sm transition-colors hover:bg-ink-hover"
            >
              <i className="fa-solid fa-plus" /> Create Work Order
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workOrders.map((wo) => (
            <WorkOrderCard key={wo.id} workOrder={wo} />
          ))}
        </div>
      )}

      <CreateWorkOrderModal
        isOpen={isWorkOrderOpen}
        onClose={() => setWorkOrderOpen(false)}
        assets={assets}
        onDispatched={() => {
          setWorkOrderOpen(false);
          load();
        }}
      />
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed border-accent-blue/40 bg-accent-blue/5 text-[15px] text-accent-blue">
          <i className={icon} />
        </div>
        <div className="min-w-0">
          <span className="block truncate text-[11px] font-semibold text-text-muted">
            {label}
          </span>
          <h3 className="truncate text-[16px] font-bold text-text-primary">
            {value}
          </h3>
        </div>
      </div>
      <TrendSparkline />
    </div>
  );
}

function TrendSparkline() {
  return (
    <svg
      viewBox="0 0 40 22"
      className="hidden h-5 w-10 shrink-0 text-border-light sm:block"
      aria-hidden="true"
    >
      <path
        d="M1 18 H8 M1 18 L1 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 2"
        fill="none"
      />
      <rect
        x="10"
        y="14"
        width="4"
        height="8"
        rx="1"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="17"
        y="10"
        width="4"
        height="12"
        rx="1"
        fill="currentColor"
        opacity="0.7"
      />
      <rect
        x="24"
        y="6"
        width="4"
        height="16"
        rx="1"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M10 13 L17 9 L24 5 L31 1"
        stroke="#0284c7"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
