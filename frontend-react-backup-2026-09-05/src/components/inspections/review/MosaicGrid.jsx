import { getImageUrl, getMissionDefectCount, getSeverityTone } from '../inspectionHelpers.js'

export default function MosaicGrid({ results, activeIndex, onSelect }) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-14 text-center text-text-muted">
        <i className="fa-solid fa-layer-group text-2xl opacity-40" />
        <p className="text-sm">No aerial frames in inspection mission.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <i className="fa-solid fa-border-all" /> Whole Mission Spatial Defect Plot ({results.length} frames)
        </h4>
        <span className="rounded-full border border-border bg-bg-input px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
          <i className="fa-solid fa-layer-group" /> Multi-Frame Photogrammetry
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((item, idx) => {
          const isActive = idx === activeIndex
          const defectCount = getMissionDefectCount(item)
          const severity = item.metrics?.severity || 'Low'

          return (
            <button
              type="button"
              key={item.id || idx}
              onClick={() => onSelect(idx)}
              className={`overflow-hidden rounded-md border text-left transition-all ${
                isActive ? 'border-accent-blue ring-2 ring-accent-blue/30' : 'border-border hover:-translate-y-0.5 hover:shadow-card-md'
              }`}
            >
              <div className="relative h-32 w-full bg-bg-input">
                <img src={getImageUrl(item)} alt={item.filename} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Plate #{idx + 1}
                </span>
                <span
                  className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${getSeverityTone(severity)}`}
                >
                  {defectCount} Defects
                </span>
              </div>
              <div className="p-2.5">
                <div className="truncate text-xs font-bold text-text-primary">{item.filename}</div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-text-muted">
                  <span>
                    <i className="fa-solid fa-location-dot" /> Lat: {item.gps_coordinates?.lat?.toFixed(4) ?? '37.7780'},
                    Lng: {item.gps_coordinates?.lng?.toFixed(4) ?? '-122.4180'}
                  </span>
                  <strong className="text-accent-blue">{item.review_status || 'Pending'}</strong>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
