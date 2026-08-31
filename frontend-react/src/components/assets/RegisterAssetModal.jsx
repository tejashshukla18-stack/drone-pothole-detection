import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import FormField from '../ui/FormField.jsx'
import { registerAsset } from '../../api/assets.js'
import { useToast } from '../../context/ToastContext.jsx'

const ASSET_TYPE_OPTIONS = [
  { value: 'Road', label: 'Highway & Arterial Road' },
  { value: 'Bridge', label: 'Bridge Deck & Viaduct' },
  { value: 'Municipal Surface', label: 'Municipal Pavement & Apron' },
]

const INITIAL_FORM = {
  name: '',
  type: 'Road',
  code: '',
  district: '',
  surface_type: '',
  lat: '37.7780',
  lng: '-122.4180',
}

export default function RegisterAssetModal({ isOpen, onClose, onRegistered }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(INITIAL_FORM)
  const [nameError, setNameError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'name' && value.trim()) setNameError('')
  }

  function resetAndClose() {
    setForm(INITIAL_FORM)
    setNameError('')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const trimmedName = form.name.trim()
    if (!trimmedName) {
      setNameError('Asset Name is required.')
      showToast('Please enter an Asset Name before submitting.', 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      const asset = await registerAsset({
        name: trimmedName,
        type: form.type,
        code: form.code.trim(),
        district: form.district.trim() || 'Central Metro District',
        surface_type: form.surface_type.trim() || 'Dense Graded Hot-Mix Asphalt',
        lat: form.lat || '37.7780',
        lng: form.lng || '-122.4180',
      })

      showToast(`Asset "${asset.name}" (${asset.code}) registered successfully!`, 'success')
      resetAndClose()
      onRegistered?.(asset)
    } catch (err) {
      console.error('Error registering asset:', err)
      showToast(err.message || 'Failed to register asset. Please verify input fields.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Register Municipal Infrastructure Asset"
      icon="fa-solid fa-road-barrier"
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
            form="registerAssetForm"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <i className="fa-solid fa-spinner fa-spin" />}
            {isSubmitting ? 'Registering...' : 'Register Asset'}
          </button>
        </>
      }
    >
      <form id="registerAssetForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Asset Name"
          required
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g. Interstate 80 Overpass"
          error={nameError}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Asset Type"
            required
            as="select"
            options={ASSET_TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
          />
          <FormField
            label="Asset Code"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
            placeholder="e.g. HWY-I80-01"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="District"
            value={form.district}
            onChange={(e) => updateField('district', e.target.value)}
            placeholder="e.g. North Sector 3"
          />
          <FormField
            label="Pavement Surface"
            value={form.surface_type}
            onChange={(e) => updateField('surface_type', e.target.value)}
            placeholder="e.g. Hot-Mix Asphalt"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Latitude"
            type="number"
            step="any"
            value={form.lat}
            onChange={(e) => updateField('lat', e.target.value)}
          />
          <FormField
            label="Longitude"
            type="number"
            step="any"
            value={form.lng}
            onChange={(e) => updateField('lng', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  )
}
