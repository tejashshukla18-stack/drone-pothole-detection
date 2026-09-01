import { getSeverityTone, getStatusTone, formatStatusLabel, formatDateTime } from './escalationHelpers.js'

const COLUMNS = ['Ticket ID', 'Issue', 'Asset', 'Location', 'Severity', 'Priority', 'Authority', 'Status', 'Notification', 'Created']

const NOTIFICATION_LABEL = {
  NOT_CONFIGURED: 'Not sent',
  SIMULATED_SENT: 'Sent (sim.)',
  SIMULATED_FAILED: 'Failed',
}

const NOTIFICATION_TONE = {
  NOT_CONFIGURED: 'bg-border text-text-secondary',
  SIMULATED_SENT: 'bg-p3/15 text-p3',
  SIMULATED_FAILED: 'bg-p1/15 text-p1',
}

export default function IssueTable({ tickets, onSelect }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-bg-card shadow-card-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg-input/60 text-[11px] font-bold uppercase tracking-wide text-text-muted">
              {COLUMNS.map((col) => (
                <th key={col} className="whitespace-nowrap px-4 py-3">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => onSelect(ticket)}
                className="cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-bg-card-hover"
              >
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-accent-blue">{ticket.ticketId}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-primary">{ticket.issueType}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{ticket.assetName}</td>
                <td className="max-w-[160px] truncate whitespace-nowrap px-4 py-3 text-text-secondary" title={ticket.location?.address}>
                  {ticket.location?.address || '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getSeverityTone(ticket.severity)}`}>
                    {ticket.severity}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{ticket.priority?.split(' - ')[0]}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{ticket.department}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusTone(ticket.status)}`}>
                    {formatStatusLabel(ticket.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${NOTIFICATION_TONE[ticket.notificationStatus] || NOTIFICATION_TONE.NOT_CONFIGURED}`}>
                    {NOTIFICATION_LABEL[ticket.notificationStatus] || 'Not sent'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-muted">{formatDateTime(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
