import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import TopHeader from './TopHeader.jsx'

export default function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close the mobile sidebar whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar
        isOpen={isSidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay, shown behind the sidebar while it's open */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[90] bg-black/40 md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col bg-bg-base">
        <TopHeader onMenuToggle={() => setSidebarOpen((open) => !open)} />
        <main className="flex-1 px-4 pb-10 pt-6 md:px-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
