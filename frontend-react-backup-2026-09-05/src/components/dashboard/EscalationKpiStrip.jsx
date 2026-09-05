import { Link } from 'react-router-dom'

// Small, additive strip per the Issue Escalation spec — deliberately NOT a
// duplicate of the full Issue Escalation summary (see IssueKpiGrid.jsx).
export default function EscalationKpiStrip({ kpis }) {
  const items = [
    { icon: 'fa-triangle-exclamation', label: 'Critical Issues', value: kpis.escalation_critical_issues ?? 0, tone: 'text-p1' },
    { icon: 'fa-ticket', label: 'Open Tickets', value: kpis.escalation_open_tickets ?? 0, tone: 'text-accent-blue' },
    { icon: 'fa-hourglass-half', label: 'Pending Authority Response', value: kpis.escalation_pending_authority_response ?? 0, tone: 'text-p2' },
  ]

  return (
    <Link
      to="/issue-escalation"
      className="mb-4.5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-border bg-bg-card px-4 py-3 shadow-card-sm transition-colors hover:bg-bg-card-hover"
    >
      <span className="flex items-center gap-1.5 text-[12px] font-bold text-text-primary">
        <i className="fa-solid fa-file-shield text-accent-blue" /> Issue Escalation
      </span>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[12px] text-text-secondary">
          <i className={`fa-solid ${item.icon} ${item.tone}`} />
          <strong className={`text-[13px] ${item.tone}`}>{item.value}</strong> {item.label}
        </span>
      ))}
    </Link>
  )
}
