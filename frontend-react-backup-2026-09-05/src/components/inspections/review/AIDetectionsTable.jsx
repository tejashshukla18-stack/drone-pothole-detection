import { formatDefectLabel, getConfidenceNumber, getConfidenceTone, getSeverityTone } from '../inspectionHelpers.js'

function iconForLabel(label) {
  const lower = label.toLowerCase()
  if (lower.includes('crack') || lower.includes('fissure')) return 'fa-code-branch'
  if (lower.includes('spall') || lower.includes('breakout')) return 'fa-cube'
  return 'fa-circle-dot'
}

function verificationTone(status) {
  if (status === 'Verified') return 'bg-p3/15 text-p3'
  if (status === 'Rejected') return 'bg-p1/15 text-p1'
  return 'bg-p2/15 text-p2'
}

export default function AIDetectionsTable({ boxes, selectedBoxId, onSelect, onDelete }) {
  return (
    <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-text-primary">
        <i className="fa-solid fa-bullseye text-accent-blue" /> AI Detections
      </h3>

      {!boxes || boxes.length === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted">No defect detections on this frame.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-muted">
                <th className="py-2 pr-4 font-semibold">Type</th>
                <th className="py-2 pr-4 font-semibold">Severity</th>
                <th className="py-2 pr-4 font-semibold">Confidence</th>
                <th className="py-2 pr-4 font-semibold">Verification Status</th>
                <th className="py-2 pr-4 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {boxes.map((box, idx) => {
                const boxId = box.id || idx
                const label = formatDefectLabel(box, idx)
                const confNum = getConfidenceNumber(box)
                const severity = confNum >= 90 ? 'High' : confNum >= 80 ? 'Medium' : 'Low'
                const verification = box.status === 'Rejected' ? 'Rejected' : box.status === 'Verified' ? 'Verified' : 'Pending Review'

                return (
                  <tr
                    key={boxId}
                    onClick={() => onSelect(boxId)}
                    className={`cursor-pointer border-b border-border last:border-0 transition-colors ${
                      boxId === selectedBoxId ? 'bg-accent-blue/5' : 'hover:bg-bg-card-hover'
                    }`}
                  >
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-2 font-semibold text-text-primary">
                        <i className={`fa-solid ${iconForLabel(label)} text-accent-blue`} /> {label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getSeverityTone(severity)}`}>
                        {severity}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getConfidenceTone(confNum)}`}>
                        {box.confidence || `${confNum}%`}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${verificationTone(verification)}`}>
                        {verification}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <button
                        type="button"
                        title="Remove defect detection"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(boxId)
                        }}
                        className="text-text-muted transition-colors hover:text-p1"
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}