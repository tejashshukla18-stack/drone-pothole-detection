export default function DashboardEmptyPanel({ icon, title, message, action }) {
  return (
    <div
      className="relative flex min-h-[300px] items-center justify-between overflow-hidden rounded-md border border-border bg-bg-card px-8 py-10 shadow-card-sm"
    >
      {/* Faint GIS map/road backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'url(/map-pattern.svg)',
          backgroundSize: '240px 240px',
          backgroundRepeat: 'repeat',
          maskImage: 'linear-gradient(to right, black 0%, black 55%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black 55%, transparent 90%)',
        }}
      />

      {/* Centered message */}
      <div className="relative z-10 mx-auto flex max-w-md flex-1 flex-col items-center text-center">
        {icon && (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-card-hover text-2xl text-text-muted shadow-card-sm">
            <i className={icon} />
          </div>
        )}
        {title && <h4 className="text-[16px] font-bold text-text-primary">{title}</h4>}
        {message && (
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-text-muted">{message}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>

      {/* Drone illustration */}
      <img
        src="/drone-illustration.svg"
        alt=""
        aria-hidden="true"
        className="relative z-10 hidden h-[220px] w-auto shrink-0 opacity-90 lg:block"
      />
    </div>
  )
}
