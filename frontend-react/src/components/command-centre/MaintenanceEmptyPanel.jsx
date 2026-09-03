export default function MaintenanceEmptyPanel({
  icon,
  title,
  message,
  action,
}) {
  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-bg-card shadow-card-sm">
      {/* Graph-paper backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: "url(/grid-paper.svg)",
          backgroundSize: "36px 36px",
          backgroundRepeat: "repeat",
          maskImage:
            "radial-gradient(ellipse 90% 100% at center, black 35%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 100% at center, black 35%, transparent 92%)",
        }}
      />

      <div className="relative z-10 flex min-h-[300px] items-center justify-between gap-4 px-4 py-8 sm:px-8">
        <img
          src="/maintenance-empty-left.svg"
          alt=""
          aria-hidden="true"
          className="hidden h-[210px] w-auto shrink-0 opacity-90 md:block lg:h-[240px]"
        />

        <div className="mx-auto flex max-w-sm flex-1 flex-col items-center text-center">
          {icon && (
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue/10 text-2xl text-accent-blue">
              <i className={icon} />
            </div>
          )}
          {title && (
            <h4 className="text-[16px] font-bold text-text-primary">{title}</h4>
          )}
          {message && (
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-text-muted">
              {message}
            </p>
          )}
          {action && <div className="mt-5">{action}</div>}
        </div>

        <img
          src="/maintenance-empty-right.svg"
          alt=""
          aria-hidden="true"
          className="hidden h-[210px] w-auto shrink-0 opacity-90 md:block lg:h-[240px]"
        />
      </div>
    </div>
  );
}
