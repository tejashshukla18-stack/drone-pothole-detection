import { useToast } from '../../context/ToastContext.jsx'

const TYPE_STYLES = {
  success: {
    icon: 'fa-solid fa-circle-check',
    classes: 'border-p3/30 bg-p3/10 text-p3',
  },
  error: {
    icon: 'fa-solid fa-circle-exclamation',
    classes: 'border-p1/30 bg-p1/10 text-p1',
  },
  warning: {
    icon: 'fa-solid fa-triangle-exclamation',
    classes: 'border-p2/30 bg-p2/10 text-p2',
  },
  info: {
    icon: 'fa-solid fa-circle-info',
    classes: 'border-accent-blue/30 bg-accent-blue/10 text-accent-blue',
  },
}

function ToastItem({ toast, onDismiss }) {
  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info

  return (
    <div
      role="status"
      className={`animate-fade-in-up flex w-full max-w-sm items-start gap-3 rounded-md border bg-bg-surface px-4 py-3 shadow-card-lg ${style.classes}`}
    >
      <i className={`${style.icon} mt-0.5`} />
      <p className="flex-1 text-[13px] font-medium leading-snug text-text-primary">
        {toast.message}
      </p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="text-text-muted transition-colors hover:text-text-primary"
      >
        <i className="fa-solid fa-xmark text-xs" />
      </button>
    </div>
  )
}

export default function ToastViewport() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
