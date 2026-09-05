import EmptyState from '../ui/EmptyState.jsx'
import {
  formatArea,
  formatDate,
  getRiskBadgeClasses,
  getStatusBadgeClasses,
} from './landIntelligenceHelpers.js'

export default function RecentDetectionsTable({ detections, onSelect }) {
  if (!detections || detections.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-map-location-dot"
        title="No Encroachment Detections Yet"
        message="Run a parcel scan to populate recent encroachment detections here."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-input text-[11px] uppercase tracking-wide text-text-muted">
            <th className="px-4 py-3 font-semibold">Case ID</th>
            <th className="px-4 py-3 font-semibold">Parcel ID</th>
            <th className="px-4 py-3 font-semibold">Location</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Affected Area</th>
            <th className="px-4 py-3 font-semibold">Risk</th>
            <th className="px-4 py-3 font-semibold">Confidence</th>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {detections.map((d) => (
            <tr
              key={d.caseId}
              onClick={() => onSelect?.(d)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-bg-card-hover"
            >
              <td className="px-4 py-3 font-bold text-text-primary">{d.caseId}</td>
              <td className="px-4 py-3 text-text-secondary">{d.parcelId}</td>
              <td className="px-4 py-3 text-text-secondary">
                {d.village}, {d.tehsil}
                <div className="text-[11px] text-text-muted">{d.district} District</div>
              </td>
              <td className="px-4 py-3 text-text-secondary">{d.type}</td>
              <td className="px-4 py-3 font-semibold text-text-primary">
                {formatArea(d.encroachmentArea)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getRiskBadgeClasses(
                    d.riskLevel,
                  )}`}
                >
                  {d.riskLevel}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{d.confidence}%</td>
              <td className="px-4 py-3 text-text-secondary">{formatDate(d.detectedAt)}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClasses(
                    d.status,
                  )}`}
                >
                  {d.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
