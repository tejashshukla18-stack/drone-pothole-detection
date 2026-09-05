import { useLocation, useNavigate } from "react-router-dom";
import { getNavItemByPath } from "../../config/navigation.js";
import NotificationDrawer from "./NotificationDrawer.jsx";

export default function TopHeader({ onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const current = getNavItemByPath(location.pathname);

  const title = current?.title ?? "AeroPatch";
  const subtitle =
    current?.subtitle ?? "Drone pavement decision support system";

  return (
    <header className="sticky top-0 z-[90] flex h-[70px] items-center justify-between border-b border-border bg-bg-surface px-4 md:px-7">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={onMenuToggle}
          className="cursor-pointer text-xl text-text-primary md:hidden"
          aria-label="Toggle navigation menu"
        >
          <i className="fa-solid fa-bars" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-[18px] font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          <p className="hidden truncate text-xs text-text-muted sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Telemetry Status Strip */}
      <div className="hidden items-center gap-4 text-[11px] font-mono lg:flex">
        <div className="flex items-center gap-1.5 rounded border border-border bg-bg-card px-2.5 py-1 text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
          <span className="text-[10.5px] text-text-muted">GPS:</span>
          <span className="font-semibold text-text-secondary">RTK FIX</span>
        </div>
        <div className="flex items-center gap-1.5 rounded border border-border bg-bg-card px-2.5 py-1 text-slate-300">
          <i className="fa-solid fa-satellite-dish text-[10px] text-accent-blue" />
          <span className="text-[10.5px] text-text-muted">UAV LINK:</span>
          <span className="font-semibold text-text-secondary">ACTIVE</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <NotificationDrawer />

        <button
          type="button"
          onClick={() => navigate("/inspections")}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm bg-accent-blue px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_0_14px_rgba(224,122,56,0.25)] transition-all duration-150 hover:bg-accent-blue-hover active:scale-[0.98]"
        >
          <i className="fa-solid fa-plus text-xs" />
          <span className="hidden sm:inline">New Inspection</span>
        </button>
      </div>
    </header>
  );
}
