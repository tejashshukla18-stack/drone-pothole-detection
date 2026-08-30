export default function PagePlaceholder({ icon, title, message }) {
  return (
    <div className="animate-fade-in-up flex min-h-[420px] flex-col items-center justify-center rounded-md border border-dashed border-border-light bg-bg-card px-6 py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-blue/10 text-2xl text-accent-blue">
        <i className={icon} />
      </div>
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-text-muted">{message}</p>
    </div>
  )
}
