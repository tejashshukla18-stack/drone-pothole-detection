import { getImageUrl, getMissionDefectCount } from '../inspectionHelpers.js'

export default function Filmstrip({ results, activeIndex, onSelect }) {
  return (
    <div className="flex items-center gap-3 border-t border-border bg-bg-input px-4 py-2.5">
      <div className="shrink-0 text-xs font-semibold text-text-secondary">
        <i className="fa-solid fa-film" /> Mission Frames ({results.length}):
      </div>
      <div className="flex flex-1 gap-2 overflow-x-auto">
        {results.length === 0 ? (
          <span className="text-xs text-text-muted">No frames loaded in buffer.</span>
        ) : (
          results.map((item, idx) => (
            <button
              type="button"
              key={item.id || idx}
              onClick={() => onSelect(idx)}
              title={item.filename}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-sm border-2 transition-colors ${
                idx === activeIndex ? 'border-accent-blue' : 'border-transparent hover:border-border-light'
              }`}
            >
              <img src={getImageUrl(item)} alt={`Frame ${idx + 1}`} className="h-full w-full object-cover" />
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white">
                #{idx + 1} ({getMissionDefectCount(item)})
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
