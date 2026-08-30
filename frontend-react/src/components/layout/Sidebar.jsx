import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../config/navigation.js'

const badgeToneClasses = {
  default: 'bg-border text-text-secondary',
  alert: 'bg-p1/20 text-p1',
  warning: 'bg-p2/20 text-p2',
  pulse: 'bg-accent-blue text-white animate-pulse-badge',
}

function NavBadge({ badge }) {
  if (!badge) return null
  return (
    <span
      className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
        badgeToneClasses[badge.tone] || badgeToneClasses.default
      }`}
    >
      {badge.text}
    </span>
  )
}

export default function Sidebar({ isOpen, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[100] flex h-screen w-[260px] shrink-0 flex-col
        border-r border-border bg-bg-surface transition-transform duration-200 ease-in-out
        md:sticky md:top-0 md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-border px-[18px] py-[22px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-500 text-lg text-white shadow-[0_2px_8px_rgba(14,165,233,0.4)]">
          <i className="fa-solid fa-helicopter" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[18px] font-bold tracking-[-0.5px] text-text-primary">
            AeroPath <span className="font-extrabold text-accent-blue">AI</span>
          </h2>
          <p className="truncate text-[11px] tracking-[0.2px] text-text-muted">
            Drone Pavement Decision Support
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <div className="px-[10px] pb-1.5 pt-3 text-[11px] font-bold tracking-[0.8px] text-text-muted">
          MAIN NAVIGATION
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex w-full items-center gap-3 rounded-sm px-3.5 py-2.5 text-left text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-accent-blue/12 font-semibold text-accent-blue'
                  : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i
                  className={`${item.icon} w-5 text-center text-[15px] ${
                    isActive
                      ? 'text-accent-blue'
                      : 'text-text-muted group-hover:text-accent-blue'
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
      <div className="flex flex-col gap-2.5 border-t border-border bg-bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-accent-blue text-[13px] font-bold text-white">
            SL
          </div>
          <div className="flex min-w-0 flex-col">
            <strong className="truncate text-[13px] text-text-primary">
              Sarah Lin, PE
            </strong>
            <span className="truncate text-[11px] text-text-muted">
              Lead DOT Inspector
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-p3">
          <span className="h-2 w-2 rounded-full bg-p3 shadow-[0_0_8px_#10b981]" />
          <span>CV Engine Online</span>
        </div>
      </div>
    </aside>
  )
}
