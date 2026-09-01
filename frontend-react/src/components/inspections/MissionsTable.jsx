import Spinner from '../ui/Spinner.jsx'
import ErrorState from '../ui/ErrorState.jsx'
import { STATUS_BADGE_CLASSES, SEVERITY_DOT_CLASSES, getActiveDefectCount } from './inspectionHelpers.js'

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
      <div
        style={{ backgroundImage: 'url(/map-pattern.svg)', backgroundSize: '140px 140px' }}
        className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border-light bg-bg-input/40 px-6 py-14 text-center"
      >
        <img src="/drone-illustration.svg" alt="" className="h-20 w-24 opacity-80" />
        <h4 className="text-[15px] font-bold text-text-primary">No missions logged yet</h4>
        <p className="max-w-sm text-[13px] leading-relaxed text-text-muted">
          Upload aerial photos via the ingestion console or schedule an autonomous flight mission to start
          building your survey log.
        </p>
        <button
          type="button"
          onClick={onCreateMission}
          className="mt-2 inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
        >
          <i className="fa-solid fa-plus" /> Initialize mission
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-input text-[11px] uppercase tracking-wide text-text-muted">
            <th className="px-4 py-3 font-semibold">Mission</th>
            <th className="px-4 py-3 font-semibold">Target Asset</th>
            <th className="px-4 py-3 font-semibold">Drone &amp; Telemetry</th>
            <th className="px-4 py-3 font-semibold">Flight Date</th>
            <th className="px-4 py-3 font-semibold">Frames</th>
            <th className="px-4 py-3 font-semibold">Defects</th>
            <th className="px-4 py-3 font-semibold">Severity</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => {
            const activeDefects = getActiveDefectCount(m)
            return (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover">
                <td className="px-4 py-3 font-mono text-[13px] font-bold text-text-primary">{m.id}</td>
                <td className="px-4 py-3 text-text-secondary">{m.asset_name}</td>
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold text-text-primary">{m.drone_model}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-text-muted">
                    ALT {m.flight_altitude_m}m AGL &middot; {m.pilot_name}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-[13px] text-text-secondary">{m.date}</td>
                <td className="px-4 py-3 font-mono text-[13px] font-bold text-text-primary">
                  {m.total_images || 0}
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[13px] font-bold text-text-primary">{activeDefects}</span>
                  <span className="font-mono text-[11px] text-text-muted"> / {m.defects_found || 0}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                    <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT_CLASSES[m.severity] || SEVERITY_DOT_CLASSES.Low}`} />
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
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onReview(m)}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-accent-blue/40 hover:bg-bg-card-hover hover:text-accent-blue"
                  >
                    <i className="fa-solid fa-eye" /> Review
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}