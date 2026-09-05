import { useEffect, useState } from 'react'
import { saveEscalationSettings } from '../../api/settings.js'
import { useToast } from '../../context/ToastContext.jsx'

const CHANNEL_OPTIONS = ['Email', 'In-App Notification', 'SMS', 'Webhook/API']

const DEFAULTS = {
  auto_escalation_enabled: true,
  critical_issue_auto_ticket: true,
  default_sla_hours: 48,
  notification_channels: ['Email', 'In-App Notification'],
}

export default function EscalationSettingsForm({ settings }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(DEFAULTS)
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setForm((prev) => ({ ...prev, ...settings }))
    }
  }, [settings])

  function toggleChannel(channel) {
    setForm((prev) => {
      const has = prev.notification_channels.includes(channel)
      return {
        ...prev,
        notification_channels: has
          ? prev.notification_channels.filter((c) => c !== channel)
          : [...prev.notification_channels, channel],
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveEscalationSettings(form)
      showToast('Escalation settings saved successfully.', 'success')
    } catch (err) {
      console.error('Error saving escalation settings:', err)
      showToast(err.message || 'Failed to save escalation settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex items-center gap-2.5 text-[13px] font-semibold text-text-primary">
        <input
          type="checkbox"
          checked={!!form.auto_escalation_enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, auto_escalation_enabled: e.target.checked }))}
          className="h-4 w-4 accent-accent-blue"
        />
        Auto Escalation (SLA-based escalation to a higher authority)
      </label>

      <label className="flex items-center gap-2.5 text-[13px] font-semibold text-text-primary">
        <input
          type="checkbox"
          checked={!!form.critical_issue_auto_ticket}
          onChange={(e) => setForm((prev) => ({ ...prev, critical_issue_auto_ticket: e.target.checked }))}
          className="h-4 w-4 accent-accent-blue"
        />
        Critical Issue Auto Ticket (create tickets automatically on verified critical detections)
      </label>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">Default SLA (hours)</label>
        <input
          type="number"
          min="1"
          value={form.default_sla_hours}
          onChange={(e) => setForm((prev) => ({ ...prev, default_sla_hours: e.target.value }))}
          className="w-full rounded-sm border border-border bg-bg-input px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-secondary">Notification Channels</span>
        <div className="flex flex-wrap gap-3">
          {CHANNEL_OPTIONS.map((channel) => (
            <label key={channel} className="flex items-center gap-1.5 text-[12px] text-text-secondary">
              <input
                type="checkbox"
                checked={form.notification_channels?.includes(channel) || false}
                onChange={() => toggleChannel(channel)}
                className="h-3.5 w-3.5 accent-accent-blue"
              />
              {channel}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-sm border border-border-light bg-bg-input px-3 py-2.5 text-[11px] leading-relaxed text-text-muted">
        <i className="fa-solid fa-circle-info mr-1" /> Authority Routing Rules: district-matched authority first,
        with a citywide fallback department when no district-specific authority is configured.
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-1 inline-flex w-fit items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <i className={isSaving ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-floppy-disk'} />
        {isSaving ? 'Saving...' : 'Save Escalation Settings'}
      </button>
    </form>
  )
}
