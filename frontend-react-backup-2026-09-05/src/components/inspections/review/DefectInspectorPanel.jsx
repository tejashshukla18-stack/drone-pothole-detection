import { SENSITIVITY_OPTIONS } from '../inspectionHelpers.js'

const PIPELINE_TAGS = [
  { key: 'clahe', label: 'CLAHE', title: 'Contrast-Limited Adaptive Histogram Equalization' },
  { key: 'bilateral', label: 'Bilateral Filter', title: 'Bilateral Smoothing preserving asphalt cavity rims' },
  { key: 'fpn', label: 'FPN Neck', title: 'Feature Pyramid Network Multi-Scale Fusion' },
  { key: 'attention', label: 'Attention Head', title: 'Spatial Attention Head focusing on cavities' },
  { key: 'nms', label: 'IoU 0.50 NMS', title: 'IoU 0.50 Non-Maximum Suppression' },
]

const BENCHMARKS = [
  { key: 'map', label: 'mAP@0.5', value: '0.980', title: 'Mean Average Precision at IoU 0.5 (MDPI Paper)' },
  { key: 'f1', label: 'Optimal F1', value: '0.970', title: 'Optimal F1-Score at 30% confidence operating point' },
  { key: 'recall', label: 'Recall', value: '0.970', title: 'Recall at optimal boundary point' },
  { key: 'nms', label: 'NMS IoU', value: '0.50', title: 'Non-Maximum Suppression IoU Threshold' },
]

export default function DefectInspectorPanel({
  activeItem,
  boxes,
  missionTotalDefects,
  engineUsed,
  sensitivity,
  onSensitivityChange,
  onReanalyze,
  isReanalyzing,
}) {
  const defectCount = boxes.length
  const totalArea = boxes.reduce((sum, b) => sum + (b.area_cm2 || 380), 0)

  return (
    <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
          <i className="fa-solid fa-microchip text-accent-blue" /> AI Analysis Engine
        </h3>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-1 text-xs font-semibold text-accent-blue">
          <i className="fa-solid fa-brain" /> {engineUsed || 'DPD-Net Vision'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          {/* Benchmark Strip */}
          <div className="grid grid-cols-4 gap-2 rounded-sm border border-border bg-bg-input p-2.5">
            {BENCHMARKS.map((b) => (
              <div key={b.key} title={b.title} className="flex flex-col items-center text-center">
                <span className="text-[10px] text-text-muted">{b.label}</span>
                <strong className="font-mono text-[13px] text-text-primary">{b.value}</strong>
              </div>
            ))}
          </div>

          {/* Sensitivity Tuning */}
          <div className="flex items-center gap-2">
            <select
              value={sensitivity}
              onChange={(e) => onSensitivityChange(e.target.value)}
              title="DPD-Net Calibrated Operating Threshold"
              className="flex-1 rounded-sm border border-border bg-bg-input px-2 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
            >
              {SENSITIVITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onReanalyze}
              disabled={isReanalyzing || !activeItem}
              title="Re-run DPD-Net neural detection with CLAHE & attention head"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm border border-border px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i className={`fa-solid fa-arrows-rotate ${isReanalyzing ? 'fa-spin' : ''}`} />
              {isReanalyzing ? 'DPD-Net Inception...' : 'Re-analyze'}
            </button>
          </div>

          {/* Pipeline Checklist */}
          <div className="rounded-sm border border-border bg-bg-input p-2.5">
            <div className="mb-1.5 text-[11px] font-semibold text-text-secondary">
              <i className="fa-solid fa-sliders" /> DPD-Net Pipeline Modules:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_TAGS.map((tag) => (
                <span
                  key={tag.key}
                  title={tag.title}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold text-accent-blue"
                >
                  <i className="fa-solid fa-check" /> {tag.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-sm bg-bg-input px-2.5 py-2 text-center">
              <span className="block text-[10px] text-text-muted">Defects (Frame)</span>
              <h4 className="font-mono text-lg font-bold text-text-primary">{defectCount}</h4>
            </div>
            <div className="rounded-sm bg-bg-input px-2.5 py-2 text-center">
              <span className="block text-[10px] text-text-muted">Mission Total</span>
              <h4 className="font-mono text-lg font-bold text-accent-blue">{missionTotalDefects}</h4>
            </div>
            <div className="rounded-sm bg-bg-input px-2.5 py-2 text-center">
              <span className="block text-[10px] text-text-muted">Est. Area</span>
              <h4 className="font-mono text-lg font-bold text-text-primary">{totalArea} cm²</h4>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="flex-1 rounded-sm border border-accent-indigo/20 bg-accent-indigo/5 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-accent-indigo">
              <i className="fa-solid fa-wand-magic-sparkles" /> AI Engineering Recommendation:
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              {activeItem?.ai_recommendation ||
                'No aerial inspection footage loaded. Ingest drone video from the Flight Ingestion tab to run neural defect segmentation and view severity ratings.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}