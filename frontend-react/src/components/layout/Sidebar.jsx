import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../config/navigation.js";

const badgeToneClasses = {
  default: "bg-slate-100 text-slate-800",
  alert: "bg-orange-500 text-white",
  warning: "bg-p2/25 text-amber-300",
  pulse: "bg-slate-600 text-slate-100 animate-pulse-badge",
};

function NavBadge({ badge }) {
  if (!badge) return null;
  return (
    <span
      className={`ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-bold leading-tight ${
        badgeToneClasses[badge.tone] || badgeToneClasses.default
      }`}
    >
      {badge.text}
    </span>
  );
}

export default function Sidebar({ isOpen, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[100] flex h-screen w-[248px] shrink-0 flex-col
        border-r border-[#232838] bg-[#0d1015] transition-transform duration-200 ease-in-out
        md:sticky md:top-0 md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Brand */}
      <div className="flex items-center bg-gradient-to-br from-[#e2e5ea] via-[#c7ccd3] to-[#9aa1ab] px-[18px] py-3.5">
        <img
          src="/aeropatch-logo.png"
          alt="AeroPatch — Infrastructure Drone Solutions"
          className="h-14 w-auto shrink-0"
          width={1469}
          height={704}
        />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <div className="px-[10px] pb-1.5 pt-2 text-[10.5px] font-bold tracking-[0.8px] text-slate-500">
          MAIN NAVIGATION
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-white/10 font-semibold text-sky-400"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i
                  className={`${item.icon} w-5 text-center text-[14px] ${
                    isActive
                      ? "text-sky-400"
                      : "text-slate-500 group-hover:text-sky-400"
                  }`}
                />
                <span>{item.label}</span>
                <NavBadge badge={item.badge} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2.5 border-t border-[#232838] p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-accent-blue text-[12px] font-bold text-white">
            SL
          </div>
          <div className="flex min-w-0 flex-col">
            <strong className="truncate text-[13px] text-white">
              Sarah Lin, PE
            </strong>
            <span className="truncate text-[11px] text-slate-500">
              Lead DOT Inspector
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          <span>CV Engine Online</span>
        </div>
      </div>
    </aside>
  );
}
