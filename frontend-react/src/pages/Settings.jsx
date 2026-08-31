import { useCallback, useEffect, useState } from 'react'
import { fetchSettings } from '../api/settings.js'
import Spinner from '../components/ui/Spinner.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import DepartmentSettingsForm from '../components/settings/DepartmentSettingsForm.jsx'
import UsersList from '../components/settings/UsersList.jsx'

export default function Settings() {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [settings, setSettings] = useState({})
  const [users, setUsers] = useState([])

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchSettings()
      setSettings(data.settings || {})
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
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-building-columns text-accent-blue" /> Municipal Department
            Settings
          </h3>
          <p className="mt-0.5 text-[12px] text-text-muted">
            Agency details and official engineering report credentials
          </p>
        </div>
        <DepartmentSettingsForm settings={settings} />
      </div>

      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-users-gear text-accent-blue" /> Authorized Users &amp; Access
            Roles
          </h3>
          <p className="mt-0.5 text-[12px] text-text-muted">
            Role-based access for pilots, inspectors, and contractors
          </p>
        </div>
        <UsersList users={users} />
      </div>
    </div>
  )
}
