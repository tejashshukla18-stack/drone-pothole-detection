import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import MaintenanceTab from '../components/command-centre/MaintenanceTab.jsx'
import InsightsTab from '../components/command-centre/InsightsTab.jsx'

const SUB_TABS = [
  { path: 'maintenance', label: 'Maintenance', icon: 'fa-solid fa-helmet-safety' },
  { path: 'insights', label: 'Insights', icon: 'fa-solid fa-chart-line' },
]

export default function CommandCentre() {
  return (
    <div className="flex flex-col gap-5">
      <nav className="flex w-fit gap-1 rounded-md border border-border bg-bg-card p-1 shadow-card-sm">
        {SUB_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-sm px-4 py-2 text-[13px] font-semibold transition-colors ${
                isActive
                  ? 'bg-accent-blue text-white'
                  : 'text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
              }`
            }
          >
            <i className={tab.icon} />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<Navigate to="maintenance" replace />} />
        <Route path="maintenance" element={<MaintenanceTab />} />
        <Route path="insights" element={<InsightsTab />} />
        <Route path="*" element={<Navigate to="maintenance" replace />} />
      </Routes>
    </div>
  )
}
