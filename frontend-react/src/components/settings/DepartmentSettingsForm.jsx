import { useEffect, useState } from 'react'
import FormField from '../ui/FormField.jsx'
import { saveSettings } from '../../api/settings.js'
import { useToast } from '../../context/ToastContext.jsx'

const DEFAULTS = {
  dep_name: 'Department of Transportation & Municipal Infrastructure',
  city: 'Metropolitan City Authority',
  lead_engineer: 'Sarah Lin, PE',
  license: 'CA-PE #84729 / FAA Part 107 #4910284',
  coord_system: 'WGS84 (EPSG:4326) / UTM Zone 10N',
  nms_iou: 0.35,
  min_area: 85,
}

export default function DepartmentSettingsForm({ settings }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(DEFAULTS)
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setForm((prev) => ({ ...prev, ...settings }))
    }
  }, [settings])

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveSettings(form)
      showToast('System settings saved successfully.', 'success')
    } catch (err) {
      console.error('Error saving settings:', err)
      showToast(err.message || 'Failed to save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        label="Department / Authority Name"
        value={form.dep_name}
        onChange={(e) => update('dep_name', e.target.value)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="City / Municipality"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
        />
        <FormField
          label="Lead Engineer (PE)"
          value={form.lead_engineer}
          onChange={(e) => update('lead_engineer', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Inspector License / Seal #"
          value={form.license}
          onChange={(e) => update('license', e.target.value)}
        />
        <FormField
          label="Geodetic Coordinate Datum"
          value={form.coord_system}
          onChange={(e) => update('coord_system', e.target.value)}
        />
      </div>

      <div className="mt-1 flex items-center gap-2 text-[13px] font-bold text-text-primary">
        <i className="fa-solid fa-sliders text-accent-blue" /> AI Computer Vision Sensitivity:
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="NMS IoU Threshold (0.1 - 0.9)"
          type="number"
          step="0.05"
          min="0.1"
          max="0.9"
          value={form.nms_iou}
          onChange={(e) => update('nms_iou', e.target.value)}
        />
        <FormField
          label="Min Cavity Area (cm²)"
          type="number"
          value={form.min_area}
          onChange={(e) => update('min_area', e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-1 inline-flex w-fit items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <i className={isSaving ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-floppy-disk'} />
        {isSaving ? 'Saving...' : 'Save System Settings'}
      </button>
    </form>
  )
}
