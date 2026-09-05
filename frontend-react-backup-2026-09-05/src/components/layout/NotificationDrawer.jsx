import { useCallback, useEffect, useState } from 'react'
import { fetchNotifications, markAllNotificationsRead } from '../../api/notifications.js'
import { useToast } from '../../context/ToastContext.jsx'
import Spinner from '../ui/Spinner.jsx'

const TYPE_ICON = {
  report: 'fa-solid fa-file-shield',
  work_order: 'fa-solid fa-helmet-safety',
  inspection: 'fa-solid fa-satellite-dish',
  asset: 'fa-solid fa-road-barrier',
  system: 'fa-solid fa-gear',
  escalation: 'fa-solid fa-triangle-exclamation',
}

const TYPE_TONE = {
  report: 'text-accent-blue bg-accent-blue/10',
  work_order: 'text-p2 bg-p2/10',
  inspection: 'text-accent-teal bg-accent-teal/10',
  asset: 'text-p1 bg-p1/10',
  system: 'text-text-muted bg-bg-card-hover',
  escalation: 'text-p1 bg-p1/10',
}

export default function NotificationDrawer() {
  const { showToast } = useToast()
  const [isOpen, setOpen] = useState(false)
  const [status, setStatus] = useState('loading') // loading | success | error
  const [notifications, setNotifications] = useState([])

  const load = useCallback(async () => {
    setStatus((prev) => (prev === 'success' ? 'success' : 'loading'))
    try {
      const data = await fetchNotifications()
      setNotifications(data)
      setStatus('success')
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
    // Poll periodically so the unread badge stays fresh across the app,
    // mirroring how the legacy frontend refreshed AppState.notifications
    // after most write operations.
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      setNotifications((current) => current.map((n) => ({ ...n, read: true })))
      showToast('All notifications marked as read.', 'info')
    } catch (err) {
      console.error('Error marking notifications as read:', err)
      showToast(err.message || 'Failed to mark notifications as read.', 'error')
    }
  }

  return (
    <>
      <button
        type="button"
        title="Notifications"
        onClick={() => {
          setOpen(true)
          load()
        }}
        className="relative inline-flex items-center gap-2 rounded-sm border border-border bg-bg-card px-3 py-2 text-[13px] font-semibold text-text-primary transition-colors hover:bg-bg-card-hover"
      >
        <i className="fa-solid fa-bell" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-p1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[180] bg-black/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="animate-fade-in-up absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-border bg-bg-surface shadow-card-lg">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
                <i className="fa-solid fa-bell" /> System Notifications
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-bg-card-hover hover:text-text-primary"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="border-b border-border px-5 py-2.5">
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-blue transition-colors hover:text-accent-blue-hover disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:text-text-muted"
              >
                <i className="fa-solid fa-check-double" /> Mark All as Read
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {status === 'loading' && <Spinner label="Loading notifications..." />}

              {status === 'error' && (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 px-4 text-center text-text-muted">
                  <i className="fa-solid fa-triangle-exclamation text-lg text-p1" />
                  <p className="text-[13px]">Could not load notifications.</p>
                  <button
                    type="button"
                    onClick={load}
                    className="mt-1 text-[12px] font-semibold text-accent-blue hover:text-accent-blue-hover"
                  >
                    Retry
                  </button>
                </div>
              )}

              {status === 'success' && notifications.length === 0 && (
                <div className="flex min-h-[160px] items-center justify-center px-4 text-center text-[13px] text-text-muted">
                  No notifications.
                </div>
              )}

              {status === 'success' &&
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`mb-2 rounded-md border px-3.5 py-3 ${
                      n.read ? 'border-border bg-bg-card' : 'border-accent-blue/30 bg-accent-blue/5'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                          TYPE_TONE[n.type] || TYPE_TONE.system
                        }`}
                      >
                        <i className={TYPE_ICON[n.type] || TYPE_ICON.system} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-bold text-text-primary">{n.title}</h4>
                        <p className="mt-0.5 text-[12px] leading-snug text-text-secondary">{n.message}</p>
                        <span className="mt-1 block text-[11px] text-text-muted">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
