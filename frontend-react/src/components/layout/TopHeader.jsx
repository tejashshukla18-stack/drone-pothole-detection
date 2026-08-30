import { useLocation, useNavigate } from 'react-router-dom'
import { getNavItemByPath } from '../../config/navigation.js'

export default function TopHeader({ onMenuToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const current = getNavItemByPath(location.pathname)

  const title = current?.title ?? 'AeroPath AI'
  const subtitle =
    current?.subtitle ?? 'Drone pavement decision support system'

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
        <div className="hidden items-center gap-2 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-3 py-1.5 text-xs font-semibold text-accent-teal lg:flex">
          <i className="fa-solid fa-tower-broadcast" />
          <span>RTK GPS Fixed (0.8cm)</span>
        </div>

        <button
          type="button"
          title="Notifications"
          className="relative inline-flex items-center gap-2 rounded-sm border border-border bg-bg-card px-3 py-2 text-[13px] font-semibold text-text-primary transition-colors hover:bg-bg-card-hover"
        >
          <i className="fa-solid fa-bell" />
          <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-p1 text-[10px] font-bold text-white">
            2
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/inspections')}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
        >
          <i className="fa-solid fa-plus" />
          <span className="hidden sm:inline">New Inspection</span>
        </button>
      </div>
    </header>
  )
}
