export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-md border border-dashed border-border-light bg-bg-card px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue/10 text-2xl text-accent-blue">
          <i className={icon} />
        </div>
      )}
      {title && <h4 className="text-[15px] font-bold text-text-primary">{title}</h4>}
      {message && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-text-muted">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
