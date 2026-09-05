import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../config/navigation.js";
import AeroPatchLogo from "./AeroPatchLogo.jsx";

const badgeToneClasses = {
  default: "bg-[#1e2637] text-slate-300 border border-[#28334a]",
  alert: "bg-red-500/20 text-red-400 border border-red-500/30",
  warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  pulse: "bg-accent-blue/20 text-accent-blue border border-accent-blue/30 animate-pulse-badge",
};

function NavBadge({ badge }) {
  if (!badge) return null;
  return (
    <span
      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold leading-tight ${
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
      <div className="flex items-center justify-center border-b border-[#232838] bg-[#090c10]/60 px-4 py-3.5">
        <AeroPatchLogo
          className="h-auto w-full max-w-[180px]"
          variant="dark"
        />
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <div className="px-[10px] pb-1.5 pt-2 text-[10px] font-bold tracking-[0.1em] text-slate-500">
          MAIN NAVIGATION
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/[0.07] font-semibold text-white border-l-2 border-accent-blue shadow-[inset_0_0_12px_rgba(224,122,56,0.06)]"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i
                  className={`${item.icon} w-5 text-center text-[14px] transition-colors duration-150 ${
                    isActive
                      ? "text-accent-blue"
                      : "text-slate-500 group-hover:text-slate-300"
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
      <div className="flex flex-col gap-2.5 border-t border-[#232838] p-4 bg-[#090c10]/40">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-accent-blue text-[12px] font-bold text-white shadow-[0_0_8px_rgba(224,122,56,0.3)]">
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
        <div className="flex items-center justify-between text-[11px] font-medium text-emerald-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>CV Engine Online</span>
          </div>
          <span className="font-mono text-[9.5px] text-slate-500">v2.6 YOLO</span>
        </div>
      </div>
    </aside>
  );
}
