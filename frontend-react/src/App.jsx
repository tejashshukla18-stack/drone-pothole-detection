import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Infrastructure from './pages/Infrastructure.jsx'
import Inspections from './pages/Inspections.jsx'
import CommandCentre from './pages/CommandCentre.jsx'
import IssueEscalation from './pages/IssueEscalation.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/infrastructure" element={<Infrastructure />} />
        <Route path="/inspections" element={<Inspections />} />
        <Route path="/command-centre/*" element={<CommandCentre />} />
        <Route path="/issue-escalation" element={<IssueEscalation />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
