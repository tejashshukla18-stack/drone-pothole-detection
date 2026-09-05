import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import FormField from '../ui/FormField.jsx'
import { createMission } from '../../api/inspections.js'
import { useToast } from '../../context/ToastContext.jsx'

const INITIAL_FORM = {
  title: '',
  assetId: '',
  droneModel: 'DJI Matrice 350 RTK',
  pilot: 'Capt. Dave Miller',
  altitude: '40',
}

export default function CreateMissionModal({ isOpen, onClose, assets, defaultAssetId, onCreated }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(INITIAL_FORM)
  const [titleError, setTitleError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'title' && value.trim()) setTitleError('')
  }

  function resetAndClose() {
    setForm(INITIAL_FORM)
    setTitleError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const trimmedTitle = form.title.trim()
    if (!trimmedTitle) {
      setTitleError('Mission Title is required.')
      showToast('Please enter a Mission Title.', 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      const mission = await createMission({
        title: trimmedTitle,
        asset_id: form.assetId || defaultAssetId || (assets[0]?.id ?? ''),
        drone_model: form.droneModel || 'DJI Matrice 350 RTK',
        pilot_name: form.pilot || 'Capt. Dave Miller',
        flight_altitude_m: form.altitude || '40',
      })

      showToast('Drone Inspection Flight Mission Initialized!', 'success')
      resetAndClose()
      onCreated?.(mission)
    } catch (err) {
      console.error('Error initializing mission:', err)
      showToast(err.message || 'Failed to initialize flight mission.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Schedule Drone Inspection Flight"
      icon="fa-solid fa-satellite"
      footer={
        <>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-sm border border-border px-4 py-2 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="createMissionForm"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <i className="fa-solid fa-spinner fa-spin" />}
            {isSubmitting ? 'Initializing...' : 'Initialize Flight Mission'}
          </button>
        </>
      }
    >
      <form id="createMissionForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Mission Title"
          required
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="e.g. Highway 101 Autonomous Pavement Scan"
          error={titleError}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Target Asset"
            required
            as="select"
            value={form.assetId || defaultAssetId || ''}
            onChange={(e) => updateField('assetId', e.target.value)}
            options={[
              { value: '', label: 'Select Asset...' },
              ...assets.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` })),
            ]}
          />
          <FormField
            label="UAS Drone Model"
            value={form.droneModel}
            onChange={(e) => updateField('droneModel', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Pilot in Command (FAA Part 107)"
            value={form.pilot}
            onChange={(e) => updateField('pilot', e.target.value)}
          />
          <FormField
            label="Flight Altitude (m AGL)"
            type="number"
            step="any"
            className="[&_input]:font-mono"
            value={form.altitude}
            onChange={(e) => updateField('altitude', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  )
}