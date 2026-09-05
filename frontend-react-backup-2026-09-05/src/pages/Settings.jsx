import { useCallback, useEffect, useState } from 'react'
import { fetchSettings } from '../api/settings.js'
import Spinner from '../components/ui/Spinner.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import DepartmentSettingsForm from '../components/settings/DepartmentSettingsForm.jsx'
import EscalationSettingsForm from '../components/settings/EscalationSettingsForm.jsx'
import UsersList from '../components/settings/UsersList.jsx'

export default function Settings() {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [settings, setSettings] = useState({})
  const [escalationSettings, setEscalationSettings] = useState({})
  const [users, setUsers] = useState([])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchSettings()
      setSettings(data.settings || {})
      setEscalationSettings(data.escalation_settings || {})
      setUsers(data.users || [])
      setStatus('success')
    } catch (err) {
      console.error('Error fetching settings:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (status === 'loading') {
    return <Spinner label="Loading settings..." />
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Unable to load settings"
        message="Department settings and access roles could not be retrieved from the server."
        onRetry={load}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent-teal">Operations console</p>
          <h2 className="flex items-center gap-2 text-[20px] font-extrabold text-text-primary"><i className="fa-solid fa-sliders text-accent-teal" /> System Settings</h2>
          <p className="mt-1 text-[13px] text-text-muted">Control inspection credentials, automated ticketing, geofence safety, and notification routing.</p>
        </div>
        <div className="rounded-sm border border-p3/30 bg-p3/10 px-3 py-2 text-[12px] font-semibold text-p3"><i className="fa-solid fa-circle-check mr-1.5" /> Settings service connected</div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-building-columns text-accent-teal" /> Municipal Department
            Settings
          </h3>
          <p className="mt-0.5 text-[12px] text-text-muted">
            Agency details and official engineering report credentials
          </p>
        </div>
        <DepartmentSettingsForm settings={settings} />
      </div>

      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-file-shield text-p2" /> Issue Escalation
          </h3>
          <p className="mt-0.5 text-[12px] text-text-muted">
            Auto-escalation, default SLA, and notification channel configuration
          </p>
        </div>
        <EscalationSettingsForm settings={escalationSettings} />
      </div>

      <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm xl:col-span-2">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-users-gear text-accent-teal" /> Authorized Users &amp; Access
            Roles
          </h3>
          <p className="mt-0.5 text-[12px] text-text-muted">
            Role-based access for pilots, inspectors, and contractors
          </p>
        </div>
        <UsersList users={users} />
      </div>
      </div>
    </div>
  )
}
