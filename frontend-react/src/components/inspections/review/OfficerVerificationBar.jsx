export default function OfficerVerificationBar({
  notes,
  onNotesChange,
  onConfirm,
  isVerifying,
  onFalsePositive,
  onFieldSurvey,
  disabled,
}) {
  return (
    <div className="rounded-md border border-border bg-bg-card p-5 shadow-card-sm">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-text-primary">
        <i className="fa-solid fa-user-shield text-accent-blue" /> Officer Verification
      </h3>

      <textarea
        rows={2}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Enter engineering observation or verification remarks..."
        className="mb-3 w-full resize-none rounded-sm border border-border bg-bg-input px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || isVerifying}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-p3 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={`fa-solid ${isVerifying ? 'fa-spinner fa-spin' : 'fa-circle-check'}`} /> Confirm
        </button>
        <button
          type="button"
          onClick={onFalsePositive}
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-p1/30 bg-p1/10 px-3 py-2.5 text-[13px] font-semibold text-p1 transition-colors hover:bg-p1/20"
        >
          <i className="fa-solid fa-circle-xmark" /> False Positive
        </button>
        <button
          type="button"
          onClick={onFieldSurvey}
          className="inline-flex items-center justify-center gap-2 rounded-sm border border-p2/30 bg-p2/10 px-3 py-2.5 text-[13px] font-semibold text-p2 transition-colors hover:bg-p2/20"
        >
          <i className="fa-solid fa-helmet-safety" /> Field Survey Required
        </button>
      </div>
    </div>
  )
}
