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
          <h1 className="truncate text-[19px] font-bold text-text-primary">
            {title}
          </h1>
          <p className="hidden truncate text-xs text-text-muted sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3.5">
        <NotificationDrawer />

        <button
          type="button"
          onClick={() => navigate("/inspections")}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm bg-[#0f172a] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1e293b]"
        >
          <i className="fa-solid fa-plus" />
          <span className="hidden sm:inline">New Inspection</span>
        </button>
      </div>
    </header>
  );
}
