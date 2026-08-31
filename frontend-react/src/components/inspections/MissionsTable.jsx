import Spinner from '../ui/Spinner.jsx'
import ErrorState from '../ui/ErrorState.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { SEVERITY_BADGE_CLASSES, STATUS_BADGE_CLASSES } from './inspectionHelpers.js'

export default function MissionsTable({ status, missions, onRetry, onReview, onCreateMission }) {
  if (status === 'loading') return <Spinner label="Loading flight missions..." />
  if (status === 'error') {
    return (
      <ErrorState
        title="Couldn't load flight missions"
        message="There was a problem reaching the mission log. Please try again."
        onRetry={onRetry}
      />
    )
  }

  if (!missions || missions.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-satellite-dish"
        title="No Drone Inspection Missions Logged"
        message="Upload aerial photos via the ingestion dropzone or schedule an autonomous flight mission."
        action={
          <button
            type="button"
            onClick={onCreateMission}
            className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
          >
            <i className="fa-solid fa-plus" /> Initialize Mission
          </button>
        }
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-input text-[11px] uppercase tracking-wide text-text-muted">
            <th className="px-4 py-3 font-semibold">Mission ID</th>
            <th className="px-4 py-3 font-semibold">Target Asset</th>
            <th className="px-4 py-3 font-semibold">Drone &amp; Telemetry</th>
            <th className="px-4 py-3 font-semibold">Flight Date</th>
            <th className="px-4 py-3 font-semibold">Frames</th>
            <th className="px-4 py-3 font-semibold">Defects</th>
            <th className="px-4 py-3 font-semibold">Severity</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => (
            <tr key={m.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover">
              <td className="px-4 py-3 font-bold text-text-primary">{m.id}</td>
              <td className="px-4 py-3 text-text-secondary">{m.asset_name}</td>
              <td className="px-4 py-3">
                <div className="text-xs font-semibold text-text-primary">{m.drone_model}</div>
                <div className="text-[11px] text-text-muted">
                  Alt: {m.flight_altitude_m}m AGL • Pilot: {m.pilot_name}
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary">{m.date}</td>
              <td className="px-4 py-3 font-bold text-text-primary">{m.total_images || 0}</td>
              <td className="px-4 py-3">
                <strong className={m.defects_found > 3 ? 'text-p1' : 'text-p2'}>{m.defects_found}</strong>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    SEVERITY_BADGE_CLASSES[m.severity] || SEVERITY_BADGE_CLASSES.Low
                  }`}
                >
                  {m.severity}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    STATUS_BADGE_CLASSES[m.status] || STATUS_BADGE_CLASSES.Scheduled
                  }`}
                >
                  {m.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onReview(m)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
                >
                  <i className="fa-solid fa-eye" /> Review
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
