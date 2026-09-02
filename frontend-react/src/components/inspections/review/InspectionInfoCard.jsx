import { STATUS_BADGE_CLASSES } from '../inspectionHelpers.js'

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-xs last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className={`font-semibold text-text-primary ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

export default function InspectionInfoCard({
  mission,
  frameCount,
  onApproveBatch,
  isBatchVerifying,
  onGenerateReport,
  isGeneratingReport,
}) {
  return (
    <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-text-primary">
        <i className="fa-solid fa-clipboard-list text-accent-blue" /> Inspection
      </h3>

      <div className="flex flex-col">
        <InfoRow label="Asset" value={mission?.asset_name || '—'} />
        <InfoRow label="Date" value={mission?.date || '—'} mono />
        <InfoRow label="Data" value="Drone Video" />
        <InfoRow label="Drone" value={mission?.drone_model || '—'} />
        <InfoRow label="Pilot" value={mission?.pilot_name || '—'} />
        <InfoRow label="Altitude" value={mission?.flight_altitude_m ? `${mission.flight_altitude_m}m AGL` : '—'} mono />
        <InfoRow label="Frames Analyzed" value={frameCount} mono />
        <div className="flex items-center justify-between py-2 text-xs">
          <span className="text-text-muted">Status</span>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              STATUS_BADGE_CLASSES[mission?.status] || STATUS_BADGE_CLASSES.Scheduled
            }`}
          >
            {mission?.status || 'Scheduled'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
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
          Complete Report
        </button>
      </div>
    </div>
  )
}