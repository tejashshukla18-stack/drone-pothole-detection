import { useCallback, useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import FormField from '../ui/FormField.jsx'
import CreateWorkOrderModal from '../inspections/review/CreateWorkOrderModal.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { fetchMaintenance } from '../../api/maintenance.js'
import {
  getSeverityTone,
  getStatusTone,
  formatStatusLabel,
  formatDateTime,
  LIFECYCLE_STEPS,
  lifecycleIndex,
} from './escalationHelpers.js'
import {
  retryNotification,
  acknowledgeTicket,
  escalateTicket,
  linkWorkOrder,
  resolveTicket,
  verifyTicket,
  closeTicket,
} from '../../api/escalations.js'

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-[13px] text-text-primary">{value ?? '—'}</span>
    </div>
  )
}

function DispatchStep({ done, failed, label, detail }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
          failed ? 'bg-p1/15 text-p1' : done ? 'bg-p3/15 text-p3' : 'bg-border text-text-muted'
        }`}
      >
        <i className={`fa-solid ${failed ? 'fa-xmark' : done ? 'fa-check' : 'fa-circle-notch fa-spin'}`} />
      </span>
      <div className="min-w-0">
        <span className={`block text-[13px] font-semibold ${failed ? 'text-p1' : 'text-text-primary'}`}>{label}</span>
        {detail && <span className="text-[11px] leading-snug text-text-muted">{detail}</span>}
      </div>
    </div>
  )
}

// Traceability chain shown as a small horizontal breadcrumb — the full
// "should not require searching multiple pages" chain from the spec.
function TraceChain({ ticket }) {
  const steps = [
    { label: 'Detection', value: ticket.detectionId },
    { label: 'Asset', value: ticket.assetName },
    { label: 'Inspection', value: ticket.inspectionId },
    { label: 'AI Review', value: ticket.confidence },
    { label: 'Severity', value: ticket.severity },
    { label: 'Authority', value: ticket.authorityName },
    { label: 'Ticket', value: ticket.ticketId },
    {
      label: 'Notification',
      value:
        ticket.notificationStatus === 'SIMULATED_SENT'
          ? 'Sent (sim.)'
          : ticket.notificationStatus === 'SIMULATED_FAILED'
          ? 'Failed'
          : 'Not sent',
    },
    { label: 'Maintenance', value: ticket.workOrderId || '—' },
    { label: 'Resolution', value: formatStatusLabel(ticket.status) },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 rounded-md border border-border bg-bg-input p-3">
      {steps.map((s, i) => (
        <span key={s.label} className="flex items-center gap-1.5">
          <span className="rounded-sm border border-border-light bg-bg-card px-2 py-1 text-[11px]">
            <strong className="text-text-primary">{s.label}:</strong>{' '}
            <span className="text-text-secondary">{s.value ?? '—'}</span>
          </span>
          {i < steps.length - 1 && <i className="fa-solid fa-chevron-right text-[9px] text-text-muted" />}
        </span>
      ))}
    </div>
  )
}

function LifecycleStepper({ status }) {
  const idx = lifecycleIndex(status)
  const isSideBranch = status === 'ESCALATED' || status === 'REOPENED'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {LIFECYCLE_STEPS.map((step, i) => (
          <span key={step} className="flex items-center gap-1">
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                !isSideBranch && i <= idx ? 'bg-accent-blue text-white' : 'bg-border text-text-muted'
              }`}
            >
              {formatStatusLabel(step)}
            </span>
            {i < LIFECYCLE_STEPS.length - 1 && <i className="fa-solid fa-chevron-right text-[8px] text-text-muted" />}
          </span>
        ))}
      </div>
      {isSideBranch && (
        <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusTone(status)}`}>
          <i className="fa-solid fa-triangle-exclamation mr-1" /> {formatStatusLabel(status)}
        </span>
      )}
    </div>
  )
}

export default function IssueDetailModal({ ticket: initialTicket, onClose, onUpdated }) {
  const { showToast } = useToast()
  const [ticket, setTicket] = useState(initialTicket)
  const [isBusy, setBusy] = useState(false)
  const [workOrders, setWorkOrders] = useState([])
  const [isCreateWorkOrderOpen, setCreateWorkOrderOpen] = useState(false)
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('')

  useEffect(() => {
    setTicket(initialTicket)
  }, [initialTicket])

  const loadWorkOrders = useCallback(async () => {
    if (!initialTicket) return
    try {
      const orders = await fetchMaintenance()
      setWorkOrders(orders.filter((w) => w.asset_id === initialTicket.assetId))
    } catch (err) {
      console.error('Error loading work orders for linking:', err)
    }
  }, [initialTicket])

  useEffect(() => {
    if (initialTicket) loadWorkOrders()
  }, [initialTicket, loadWorkOrders])

  if (!ticket) return null

  function applyUpdate(updated) {
    setTicket(updated)
    onUpdated?.(updated)
  }

  async function runAction(actionFn, successMessage) {
    setBusy(true)
    try {
      const updated = await actionFn()
      applyUpdate(updated)
      if (successMessage) showToast(successMessage, 'success')
    } catch (err) {
      console.error('Error updating escalation ticket:', err)
      showToast(err.message || 'Unable to process the request.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const isClosed = ticket.status === 'CLOSED'
  const dispatch = ticket.dispatchLog?.[ticket.dispatchLog.length - 1] || null
  const notificationSent = ticket.notificationStatus === 'SIMULATED_SENT'
  const notificationFailed = ticket.notificationStatus === 'SIMULATED_FAILED'
  const isOverdue =
    ticket.slaDeadline &&
    new Date(ticket.slaDeadline).getTime() < Date.now() &&
    !['RESOLVED', 'CLOSED'].includes(ticket.status)

  return (
    <Modal isOpen={!!ticket} onClose={onClose} title={ticket.ticketId} icon="fa-solid fa-ticket" maxWidth="max-w-3xl">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getSeverityTone(ticket.severity)}`}>
            {ticket.severity} Severity
          </span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusTone(ticket.status)}`}>
            {formatStatusLabel(ticket.status)}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              ticket.authorityResponse === 'Acknowledged' ? 'bg-p3/15 text-p3' : 'bg-p2/15 text-p2'
            }`}
          >
            Authority Response: {ticket.authorityResponse}
          </span>
          {isOverdue && (
            <span className="rounded-full bg-p1/15 px-2.5 py-1 text-[11px] font-bold text-p1">
              <i className="fa-solid fa-clock mr-1" /> SLA Overdue
            </span>
          )}
        </div>

        <LifecycleStepper status={ticket.status} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Issue" value={ticket.issueType} />
          <Field label="Asset" value={`${ticket.assetName} (${ticket.assetId})`} />
          <Field label="Inspection" value={ticket.inspectionId} />
          <Field label="AI Confidence" value={ticket.confidence} />
          <Field label="Priority" value={ticket.priority} />
          <Field label="Condition" value={ticket.condition} />
          <Field label="Risk" value={ticket.risk} />
          <Field label="Created" value={formatDateTime(ticket.createdAt)} />
          <Field label="Location" value={ticket.location?.address} />
          <Field
            label="SLA Deadline"
            value={ticket.slaDeadline ? formatDateTime(ticket.slaDeadline) : 'No SLA (non-Critical)'}
          />
        </div>

        {/* Automatic Notification: dispatch status + content */}
        <div className="rounded-md border border-border bg-bg-input p-4">
          <h4 className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
            <i className="fa-solid fa-paper-plane text-accent-blue" /> Notification Dispatch
          </h4>
          <div className="mt-3 flex flex-col gap-2.5">
            <DispatchStep done label="Ticket Created" />
            <DispatchStep done label="Authority Identified" detail={`${ticket.authorityName} — ${ticket.department}`} />
            <DispatchStep done label="Notification Prepared" detail={`Channel: ${ticket.notificationChannel || '—'}`} />
            <DispatchStep
              done={notificationSent}
              failed={notificationFailed}
              label={
                notificationFailed
                  ? 'Notification Failed'
                  : notificationSent
                  ? 'Notification Sent (Simulated)'
                  : 'Notification Pending'
              }
              detail={dispatch?.detail}
            />
          </div>

          {notificationFailed && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => runAction(() => retryNotification(ticket.id), 'Notification dispatch retried.')}
              className="mt-3 inline-flex items-center gap-2 rounded-sm bg-p1 px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-p1/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fa-solid fa-rotate-right" /> Retry Notification
            </button>
          )}

          {ticket.notificationContent && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[12px] font-semibold text-accent-blue hover:text-accent-blue-hover">
                View notification content
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-sm border border-border-light bg-bg-card p-3 text-[12px] leading-relaxed text-text-secondary">
                {ticket.notificationContent}
              </pre>
            </details>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
            <i className="fa-solid fa-circle-info mr-1" /> No real email/SMS/webhook provider is configured in this
            prototype — every dispatch above is simulated, and no authority has actually been contacted.
          </p>
        </div>

        {/* Authority Acknowledgement / manual escalation */}
        {!isClosed && (
          <div className="flex flex-wrap gap-2.5">
            {ticket.authorityResponse === 'Awaiting Response' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => runAction(() => acknowledgeTicket(ticket.id), 'Ticket acknowledged.')}
                className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="fa-solid fa-check" /> Acknowledge
              </button>
            )}
            {ticket.status !== 'ESCALATED' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => runAction(() => escalateTicket(ticket.id), 'Ticket escalated to a higher authority.')}
                className="inline-flex items-center gap-2 rounded-sm border border-p1/40 px-3.5 py-2 text-[12px] font-semibold text-p1 transition-colors hover:bg-p1/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="fa-solid fa-angles-up" /> Escalate Now
              </button>
            )}
          </div>
        )}

        {/* Maintenance integration */}
        <div className="rounded-md border border-border bg-bg-input p-4">
          <h4 className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
            <i className="fa-solid fa-helmet-safety text-accent-blue" /> Maintenance
          </h4>
          {ticket.workOrderId ? (
            <p className="mt-2 text-[13px] text-text-secondary">
              Linked to work order <strong className="text-text-primary">{ticket.workOrderId}</strong>. Track repair
              progress in Command Centre → Maintenance.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-2.5">
              <p className="text-[13px] text-text-secondary">No work order linked yet.</p>
              <div className="flex flex-wrap items-center gap-2">
                {workOrders.length > 0 && (
                  <>
                    <FormField
                      as="select"
                      className="min-w-[220px]"
                      value={selectedWorkOrderId}
                      onChange={(e) => setSelectedWorkOrderId(e.target.value)}
                      options={[
                        { value: '', label: 'Select an existing work order…' },
                        ...workOrders.map((w) => ({ value: w.id, label: `${w.id} — ${w.title}` })),
                      ]}
                    />
                    <button
                      type="button"
                      disabled={isBusy || !selectedWorkOrderId}
                      onClick={() =>
                        runAction(async () => {
                          const data = await linkWorkOrder(ticket.id, selectedWorkOrderId)
                          return data.escalation
                        }, 'Work order linked.')
                      }
                      className="inline-flex items-center gap-2 rounded-sm border border-border px-3.5 py-2 text-[12px] font-semibold text-text-primary transition-colors hover:bg-bg-card-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <i className="fa-solid fa-link" /> Link Existing
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setCreateWorkOrderOpen(true)}
                  className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
                >
                  <i className="fa-solid fa-plus" /> Dispatch New Work Order
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Resolution / verification */}
        {ticket.status === 'IN_PROGRESS' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runAction(() => resolveTicket(ticket.id), 'Repair marked complete — verification required.')}
            className="inline-flex w-fit items-center gap-2 rounded-sm bg-p3 px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-p3/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-clipboard-check" /> Mark Repair Completed
          </button>
        )}

        {ticket.status === 'VERIFICATION_REQUIRED' && (
          <div className="rounded-md border border-p2/30 bg-p2/5 p-4">
            <h4 className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
              <i className="fa-solid fa-magnifying-glass text-p2" /> Resolution Verification
            </h4>
            {ticket.verification?.afterRepairImageUrl && (
              <img
                src={ticket.verification.afterRepairImageUrl}
                alt="After-repair evidence"
                className="mt-3 max-h-56 w-full rounded-md border border-border object-cover"
              />
            )}
            <p className="mt-3 text-[13px] text-text-secondary">Is this issue resolved?</p>
            <div className="mt-2 flex gap-2.5">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => runAction(() => verifyTicket(ticket.id, true), 'Issue verified as resolved.')}
                className="inline-flex items-center gap-2 rounded-sm bg-p3 px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-p3/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="fa-solid fa-check" /> Yes — Resolved
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => runAction(() => verifyTicket(ticket.id, false), 'Issue reopened.')}
                className="inline-flex items-center gap-2 rounded-sm border border-p1/40 px-3.5 py-2 text-[12px] font-semibold text-p1 transition-colors hover:bg-p1/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="fa-solid fa-rotate-left" /> No — Reopen
              </button>
            </div>
          </div>
        )}

        {ticket.status === 'RESOLVED' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => runAction(() => closeTicket(ticket.id), 'Ticket closed.')}
            className="inline-flex w-fit items-center gap-2 rounded-sm bg-accent-blue px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fa-solid fa-box-archive" /> Close Ticket
          </button>
        )}

        {/* Authority routing explanation (kept from Part 1) */}
        <div className="rounded-md border border-border bg-bg-input p-4">
          <h4 className="flex items-center gap-2 text-[13px] font-bold text-text-primary">
            <i className="fa-solid fa-diagram-project text-accent-blue" /> Why this authority?
          </h4>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Matched Department" value={ticket.department} />
            <Field label="Authority" value={ticket.authorityName} />
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">{ticket.routingReason}</p>
        </div>

        {/* Full traceability */}
        <div>
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Full Traceability
          </span>
          <TraceChain ticket={ticket} />
        </div>

        {ticket.evidence?.image_url && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Evidence</span>
            <img
              src={ticket.evidence.image_url}
              alt={ticket.evidence.filename || 'Detection evidence'}
              className="mt-2 max-h-64 w-full rounded-md border border-border object-cover"
            />
          </div>
        )}
      </div>

      <CreateWorkOrderModal
        isOpen={isCreateWorkOrderOpen}
        onClose={() => setCreateWorkOrderOpen(false)}
        asset={{ id: ticket.assetId, name: ticket.assetName }}
        onDispatched={(workOrder) => {
          setCreateWorkOrderOpen(false)
          runAction(async () => {
            const data = await linkWorkOrder(ticket.id, workOrder.id)
            return data.escalation
          }, 'Work order dispatched and linked.')
          loadWorkOrders()
        }}
      />
    </Modal>
  )
}
