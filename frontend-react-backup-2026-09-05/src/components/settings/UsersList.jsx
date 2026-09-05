import EmptyState from '../ui/EmptyState.jsx'

function initials(name) {
  return (name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function UsersList({ users }) {
  if (!users || users.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-users-slash"
        title="No Authorized Users"
        message="No users or access roles are currently configured."
      />
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {users.map((u) => (
        <div
          key={u.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-bg-surface px-3.5 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-[12px] font-bold text-accent-blue">
              {initials(u.name)}
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-[13px] text-text-primary">{u.name}</strong>
              <span className="block truncate text-[11px] text-text-muted">
                {u.email} &bull; {u.department}
              </span>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-accent-teal/10 px-2.5 py-1 text-[11px] font-semibold text-accent-teal">
            {u.role}
          </span>
        </div>
      ))}
    </div>
  )
}
