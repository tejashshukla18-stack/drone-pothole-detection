import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, icon, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 px-4 py-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className={`animate-fade-in-up flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-md bg-bg-surface shadow-card-lg`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            {icon && <i className={icon} />}
            {title}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-text-muted transition-colors hover:bg-bg-card-hover hover:text-text-primary"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 border-t border-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
