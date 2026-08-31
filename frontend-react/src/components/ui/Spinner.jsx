export default function Spinner({ label = 'Loading...', className = '' }) {
  return (
    <div
      className={`flex min-h-[220px] flex-col items-center justify-center gap-3 text-text-muted ${className}`}
    >
      <i className="fa-solid fa-circle-notch fa-spin text-2xl text-accent-blue" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
