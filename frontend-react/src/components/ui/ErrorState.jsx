export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  onRetry,
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-md border border-dashed border-p1/30 bg-p1/5 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-p1/10 text-2xl text-p1">
        <i className="fa-solid fa-triangle-exclamation" />
      </div>
      <h4 className="text-[15px] font-bold text-text-primary">{title}</h4>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
        >
          <i className="fa-solid fa-rotate-right" />
          Retry
        </button>
      )}
    </div>
  )
}
