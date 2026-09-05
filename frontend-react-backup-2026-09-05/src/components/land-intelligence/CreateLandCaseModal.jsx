import { useEffect, useState } from 'react'
import Modal from '../ui/Modal.jsx'
import FormField from '../ui/FormField.jsx'
import RiskBadge from './RiskBadge.jsx'
import { ASSIGNED_DEPARTMENTS, CASE_PRIORITIES } from '../../data/landCaseData.js'
import { createLandCase } from '../../api/landIntelligence.js'
import { useToast } from '../../context/ToastContext.jsx'
import { formatArea, formatDate, getDisplayRiskLevel } from './landIntelligenceHelpers.js'

const DEFAULT_PRIORITY_BY_RISK = { High: 'Critical', Medium: 'High', Low: 'Medium' }

export default function CreateLandCaseModal({ isOpen, onClose, parcel, existingNotes, onCreated }) {
  const { showToast } = useToast()
  const [department, setDepartment] = useState(ASSIGNED_DEPARTMENTS[0])
  const [priority, setPriority] = useState('Medium')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && parcel) {
      setPriority(DEFAULT_PRIORITY_BY_RISK[parcel.riskLevel] || 'Medium')
      setNotes(existingNotes || '')
    }
  }, [isOpen, parcel, existingNotes])

  if (!parcel) return null

  const displayRisk = getDisplayRiskLevel(parcel)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const landCase = await createLandCase(parcel.caseId, {
        parcelId: parcel.parcelId,
        surveyNumber: parcel.surveyNumber,
        location: `${parcel.village}, ${parcel.tehsil}, ${parcel.district} District`,
        encroachmentType: parcel.type,
        affectedArea: parcel.encroachmentArea,
        risk: displayRisk,
        confidence: parcel.confidence,
        detectedAt: parcel.detectedAt,
        assignedDepartment: department,
        priority,
        officerNotes: notes,
      })
      showToast(`Land Case ${landCase.id} created and routed to ${department}.`, 'success')
      onClose()
      onCreated?.(parcel.caseId, landCase)
    } catch (err) {
      console.error('Error creating Land Case:', err)
      showToast(err.message || 'Failed to create Land Case.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Land Case"
      icon="fa-solid fa-folder-plus"
      maxWidth="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border px-4 py-2 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="createLandCaseForm"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <i className="fa-solid fa-spinner fa-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Case'}
          </button>
        </>
      }
    >
      <form id="createLandCaseForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-md border border-dashed border-border-light bg-bg-input p-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
            <span className="text-text-muted">Parcel ID</span>
            <span className="text-right font-semibold text-text-primary">{parcel.parcelId}</span>
            <span className="text-text-muted">Survey Number</span>
            <span className="text-right font-semibold text-text-primary">{parcel.surveyNumber}</span>
            <span className="text-text-muted">Location</span>
            <span className="text-right font-semibold text-text-primary">
              {parcel.village}, {parcel.tehsil}
            </span>
            <span className="text-text-muted">Encroachment Type</span>
            <span className="text-right font-semibold text-text-primary">{parcel.type}</span>
            <span className="text-text-muted">Affected Area</span>
            <span className="text-right font-semibold text-text-primary">
              {formatArea(parcel.encroachmentArea)}
            </span>
            <span className="text-text-muted">Risk</span>
            <span className="flex justify-end">
              <RiskBadge level={displayRisk} />
            </span>
            <span className="text-text-muted">AI Confidence</span>
            <span className="text-right font-semibold text-text-primary">{parcel.confidence}%</span>
            <span className="text-text-muted">Detection Date</span>
            <span className="text-right font-semibold text-text-primary">
              {formatDate(parcel.detectedAt)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Assigned Department"
            as="select"
            options={ASSIGNED_DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <FormField
            label="Priority"
            as="select"
            options={CASE_PRIORITIES.map((p) => ({ value: p, label: p }))}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Officer Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes carried over from the officer verification, or add new context..."
            className="w-full rounded-sm border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          />
        </div>
      </form>
    </Modal>
  )
}
