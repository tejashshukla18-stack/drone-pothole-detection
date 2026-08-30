// Single source of truth for the sidebar navigation and the top header's
// per-route title/subtitle. Keeping this in one place means Sidebar.jsx and
// TopHeader.jsx never fall out of sync.

export const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'fa-solid fa-chart-pie',
    title: 'Executive Overview',
    subtitle:
      'Real-time civil asset health monitoring and autonomous drone defect triage',
  },
  {
    path: '/infrastructure',
    label: 'Infrastructure',
    icon: 'fa-solid fa-road-barrier',
    badge: { text: '5', tone: 'default' },
    title: 'Municipal Infrastructure Assets',
    subtitle:
      'Manage roads, bridges, and municipal surfaces with AI condition ratings',
  },
  {
    path: '/inspections',
    label: 'Inspections',
    icon: 'fa-solid fa-satellite-dish',
    badge: { text: '3', tone: 'alert' },
    title: 'Drone Flight Missions & Ingestion',
    subtitle:
      'Upload high-resolution aerial imagery and execute computer vision detection',
  },
  {
    path: '/command-centre',
    label: 'Command Centre',
    icon: 'fa-solid fa-satellite',
    badge: { text: 'V2 ACTIVE', tone: 'pulse' },
    title: 'Command Centre',
    subtitle:
      'Unified mission control for fleet status, AI review, and work order dispatch',
  },
]

export function getNavItemByPath(pathname) {
  return NAV_ITEMS.find((item) => pathname.startsWith(item.path))
}
