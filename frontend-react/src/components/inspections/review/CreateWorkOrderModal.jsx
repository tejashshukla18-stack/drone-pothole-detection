import { useEffect, useState } from 'react'
import Modal from '../../ui/Modal.jsx'
import FormField from '../../ui/FormField.jsx'
import { createWorkOrder } from '../../../api/inspections.js'
import { useToast } from '../../../context/ToastContext.jsx'

const PRIORITY_OPTIONS = [
  { value: 'P1 - Immediate Repair', label: 'P1 - Immediate Repair' },
  { value: 'P2 - Scheduled Maintenance', label: 'P2 - Scheduled Maintenance' },
  { value: 'P3 - Routine Inspection', label: 'P3 - Routine Inspection' },
]

// `asset` (single, pre-selected) is used by the AI Review workbench where a
// confirmed defect already belongs to a known asset. `assets` (a list) is
// used by the Dashboard quick action, where the user picks the target asset
// from a dropdown before dispatching.
export default function CreateWorkOrderModal({ isOpen, onClose, asset, assets, onDispatched }) {
  const { showToast } = useToast()
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [form, setForm] = useState({
    title: '',
    priority: 'P1 - Immediate Repair',
    contractor: 'Apex Civil Roadworks Inc.',
    deadline: '',
    estimatedCost: '',
    repairMethod: 'Cold milling followed by asphalt compaction',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const needsAssetPicker = !asset && Array.isArray(assets)
  const activeAsset = asset || (assets || []).find((a) => a.id === selectedAssetId) || null

  useEffect(() => {
    if (isOpen && asset) {
      setForm((prev) => ({
        ...prev,
        title: `${asset.name} Pavement Milling & Cavity Patching`,
        estimatedCost: asset.repair_budget_estimate ? String(asset.repair_budget_estimate) : prev.estimatedCost,
      }))
    }
    if (isOpen && !asset && needsAssetPicker) {
      setSelectedAssetId((assets && assets[0]?.id) || '')
    }
  }, [isOpen, asset, needsAssetPicker, assets])

  useEffect(() => {
    if (needsAssetPicker && activeAsset) {
      setForm((prev) => ({
        ...prev,
        title: `${activeAsset.name} Pavement Milling & Cavity Patching`,
        estimatedCost: activeAsset.repair_budget_estimate
          ? String(activeAsset.repair_budget_estimate)
          : prev.estimatedCost,
      }))
    }
  }, [needsAssetPicker, activeAsset])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      showToast('Please enter a Work Order Title.', 'warning')
      return
    }
    if (needsAssetPicker && !activeAsset) {
      showToast('Please select a target asset.', 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      const workOrder = await createWorkOrder({
        title: form.title.trim(),
        asset_id: activeAsset?.id,
        priority: form.priority,
        contractor: form.contractor,
        deadline: form.deadline || '2026-09-01',
        estimated_cost: form.estimatedCost || '8500',
        repair_method: form.repairMethod,
      })
      showToast('Maintenance Work Order Dispatched to Contractor!', 'success')
      onClose()
      onDispatched?.(workOrder)
    } catch (err) {
      console.error('Error creating work order:', err)
      showToast(err.message || 'Failed to dispatch work order.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Maintenance Work Order"
      icon="fa-solid fa-helmet-safety"
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
            form="createWorkOrderFromReviewForm"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <i className="fa-solid fa-spinner fa-spin" />}
            {isSubmitting ? 'Dispatching...' : 'Dispatch Work Order'}
          </button>
        </>
      }
    >
      <form id="createWorkOrderFromReviewForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {needsAssetPicker && (
          <FormField
            label="Target Asset"
            as="select"
            required
            options={
              (assets || []).length > 0
                ? assets.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` }))
                : [{ value: '', label: 'No assets registered' }]
            }
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
          />
        )}
        <FormField
          label="Work Order Title"
          required
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Priority"
            as="select"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(e) => updateField('priority', e.target.value)}
          />
          <FormField
            label="Estimated Cost ($)"
            type="number"
            value={form.estimatedCost}
            onChange={(e) => updateField('estimatedCost', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Contractor"
            value={form.contractor}
            onChange={(e) => updateField('contractor', e.target.value)}
          />
          <FormField
            label="Deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => updateField('deadline', e.target.value)}
          />
        </div>
        <FormField
          label="Repair Method"
          as="select"
          options={[
            { value: 'Cold milling followed by asphalt compaction', label: 'Cold milling + asphalt compaction' },
            { value: 'Infrared thermal rehabilitation', label: 'Infrared thermal rehabilitation' },
            { value: 'Elastomeric crack sealing', label: 'Elastomeric crack sealing' },
          ]}
          value={form.repairMethod}
          onChange={(e) => updateField('repairMethod', e.target.value)}
        />
      </form>
    </Modal>
  )
}
