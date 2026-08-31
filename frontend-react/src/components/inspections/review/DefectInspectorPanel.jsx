import BoxList from './BoxList.jsx'
import { getSeverityTone, SENSITIVITY_OPTIONS } from '../inspectionHelpers.js'

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
  notes,
  onNotesChange,
  selectedBoxId,
  onSelectBox,
  onDeleteBox,
  onApproveFrame,
  isVerifying,
  onApproveBatch,
  isBatchVerifying,
  onGenerateReport,
  isGeneratingReport,
  onDispatchWorkOrder,
  onFlagFalsePositive,
}) {
  const severity = activeItem?.metrics?.severity || 'Low'
  const priority = activeItem?.metrics?.priority || 'P3 - Routine Inspection'
  const defectCount = boxes.length
  const totalArea = boxes.reduce((sum, b) => sum + (b.area_cm2 || 380), 0)

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-microchip text-accent-blue" /> AI Defect Inspector
          </h3>
          <span className="text-[11px] text-text-muted">Mission Scope: All Frames Plotted</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getSeverityTone(severity)}`}>
          {activeItem ? `${priority.split(' - ')[0]} - ${severity} Severity` : 'Standby'}
        </span>
      </div>

      {/* Benchmark Strip */}
      <div className="grid grid-cols-4 gap-2 rounded-sm border border-border bg-bg-input p-2.5">
        {BENCHMARKS.map((b) => (
          <div key={b.key} title={b.title} className="flex flex-col items-center text-center">
            <span className="text-[10px] text-text-muted">{b.label}</span>
            <strong className="text-[13px] text-text-primary">{b.value}</strong>
          </div>
        ))}
      </div>

      {/* Engine & Sensitivity Tuning */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-1 text-xs font-semibold text-accent-blue">
          <i className="fa-solid fa-brain" /> {engineUsed || 'DPD-Net Vision'}
        </span>
        <div className="flex items-center gap-2">
          <select
            value={sensitivity}
            onChange={(e) => onSensitivityChange(e.target.value)}
            title="DPD-Net Calibrated Operating Threshold"
            className="rounded-sm border border-border bg-bg-input px-2 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
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

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-sm bg-bg-input px-2.5 py-2 text-center">
          <span className="block text-[10px] text-text-muted">Defects (Frame)</span>
          <h4 className="text-lg font-bold text-text-primary">{defectCount}</h4>
        </div>
        <div className="rounded-sm bg-bg-input px-2.5 py-2 text-center">
          <span className="block text-[10px] text-text-muted">Mission Total</span>
          <h4 className="text-lg font-bold text-accent-blue">{missionTotalDefects}</h4>
        </div>
        <div className="rounded-sm bg-bg-input px-2.5 py-2 text-center">
          <span className="block text-[10px] text-text-muted">Est. Area</span>
          <h4 className="text-lg font-bold text-text-primary">{totalArea} cm²</h4>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="rounded-sm border border-accent-indigo/20 bg-accent-indigo/5 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-accent-indigo">
          <i className="fa-solid fa-wand-magic-sparkles" /> AI Engineering Recommendation:
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">
          {activeItem?.ai_recommendation ||
            'No aerial inspection imagery loaded. Ingest drone footage from the Flight Ingestion tab to run neural defect segmentation and view severity ratings.'}
        </p>
      </div>

      {/* Detected Boxes */}
      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-text-primary">
          <i className="fa-solid fa-bullseye" /> Detected Cavities &amp; Coordinates:
        </h4>
        <BoxList boxes={boxes} selectedBoxId={selectedBoxId} onSelect={onSelectBox} onDelete={onDeleteBox} />
      </div>

      {/* Inspector Notes */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="inspectorCommentInput" className="text-xs font-semibold text-text-secondary">
          <i className="fa-solid fa-pen-to-square" /> Civil Inspector Field Notes:
        </label>
        <textarea
          id="inspectorCommentInput"
          rows={2}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Enter engineering observation or verification remarks..."
          className="w-full resize-none rounded-sm border border-border bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-auto grid grid-cols-1 gap-2 pt-1">
        <button
          type="button"
          onClick={onApproveFrame}
          disabled={isVerifying || !activeItem}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-p3 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={`fa-solid ${isVerifying ? 'fa-spinner fa-spin' : 'fa-circle-check'}`} /> Approve Active Frame
        </button>
        <button
          type="button"
          onClick={onApproveBatch}
          disabled={isBatchVerifying}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-emerald-600 to-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={`fa-solid ${isBatchVerifying ? 'fa-spinner fa-spin' : 'fa-check-double'}`} /> Approve Whole
          Mission Batch
        </button>
        <button
          type="button"
          onClick={onGenerateReport}
          disabled={isGeneratingReport}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-sky-600 to-sky-800 px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={`fa-solid ${isGeneratingReport ? 'fa-spinner fa-spin' : 'fa-file-signature'}`} /> Generate
          Complete Report (All Images)
        </button>
        <button
          type="button"
          onClick={onDispatchWorkOrder}
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-p2/30 bg-p2/10 px-3 py-2.5 text-[13px] font-semibold text-p2 transition-colors hover:bg-p2/20"
        >
          <i className="fa-solid fa-helmet-safety" /> Create Work Order
        </button>
        <button
          type="button"
          onClick={onFlagFalsePositive}
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-p1/30 bg-p1/10 px-3 py-2.5 text-[13px] font-semibold text-p1 transition-colors hover:bg-p1/20"
        >
          <i className="fa-solid fa-circle-xmark" /> Flag False Positive
        </button>
      </div>
    </div>
  )
}
