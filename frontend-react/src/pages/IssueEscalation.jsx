import { useCallback, useEffect, useMemo, useState } from 'react'
import IssueKpiGrid from '../components/issue-escalation/IssueKpiGrid.jsx'
import IssueFilters from '../components/issue-escalation/IssueFilters.jsx'
import IssueTable from '../components/issue-escalation/IssueTable.jsx'
import IssueDetailModal from '../components/issue-escalation/IssueDetailModal.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { fetchEscalations } from '../api/escalations.js'

const DEFAULT_FILTERS = {
  severity: '',
  status: '',
  authority: '',
  asset: '',
  issueType: '',
  location: '',
  dateFrom: '',
}

export default function IssueEscalation() {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [escalations, setEscalations] = useState([])
  const [kpis, setKpis] = useState({
    critical_issues: 0,
    high_priority: 0,
    open_tickets: 0,
    resolved: 0,
    awaiting_response: 0,
    in_progress: 0,
    overdue: 0,
  })
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchEscalations()
      setEscalations(data.escalations)
      setKpis(data.kpis)
      setStatus('success')
    } catch (err) {
      console.error('Error fetching escalated issues:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredTickets = useMemo(() => {
    return escalations.filter((t) => {
      if (filters.severity && t.severity !== filters.severity) return false
      if (filters.status && t.status !== filters.status) return false
      if (filters.authority && t.department !== filters.authority) return false
      if (filters.asset && t.assetName !== filters.asset) return false
      if (filters.issueType && t.issueType !== filters.issueType) return false
      if (filters.location && !(t.location?.address || '').toLowerCase().includes(filters.location.toLowerCase())) return false
      if (filters.dateFrom && new Date(t.createdAt) < new Date(filters.dateFrom)) return false
      return true
    })
  }, [escalations, filters])

  // Keep the open detail modal's ticket in sync with the list after an
  // action (acknowledge, resolve, etc.) updates it, and refresh KPIs.
  function handleTicketUpdated(updatedTicket) {
    setEscalations((current) => current.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)))
    setSelectedTicket(updatedTicket)
    load()
  }

  if (status === 'loading') {
    return <Spinner label="Loading issues..." />
  }

  if (status === 'error') {
    return (
      <ErrorState title="Unable to load escalated issues." message="The escalation ticket list could not be retrieved from the server." onRetry={load} />
    )
  }

  return (
    <div className="flex flex-col">
      <IssueKpiGrid kpis={kpis} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-file-shield text-accent-blue" /> Automatically Escalated Issues
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Tickets generated automatically from verified detections that meet the escalation threshold
          </p>
        </div>
      </div>

      {escalations.length === 0 ? (
        <EmptyState
          icon="fa-solid fa-file-shield"
          title="No escalated issues found."
          message="Once a critical or high-severity detection is verified in AI Review, an escalation ticket will appear here automatically."
        />
      ) : (
        <>
          <IssueFilters tickets={escalations} filters={filters} onChange={setFilters} />

          {filteredTickets.length === 0 ? (
            <EmptyState
              icon="fa-solid fa-filter-circle-xmark"
              title="No tickets match the current filters."
              message="Try clearing or adjusting a filter above."
              action={
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
                >
                  <i className="fa-solid fa-rotate-left" /> Clear Filters
                </button>
              }
            />
          ) : (
            <IssueTable tickets={filteredTickets} onSelect={setSelectedTicket} />
          )}
        </>
      )}

      <IssueDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onUpdated={handleTicketUpdated} />
    </div>
  )
}
