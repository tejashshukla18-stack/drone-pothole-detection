const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Pavement Types' },
  { value: 'Road', label: 'Highway & Arterial Roads' },
  { value: 'Bridge', label: 'Bridge Decks & Viaducts' },
  { value: 'Municipal Surface', label: 'Municipal Pavements & Depots' },
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Health Status' },
  { value: 'Optimal', label: 'Optimal (85-100)' },
  { value: 'Needs Attention', label: 'Needs Attention (70-84)' },
  { value: 'Critical Repair', label: 'Critical Repair (<70)' },
]

export default function AssetToolbar({ filters, onFiltersChange, onRegisterClick }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-bg-card p-3 shadow-card-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2.5 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            placeholder="Search roads, bridges, codes, districts..."
            className="w-full rounded-sm border border-border bg-bg-input py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          />
        </div>

        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
          className="rounded-sm border border-border bg-bg-input px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          className="rounded-sm border border-border bg-bg-input px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onRegisterClick}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
      >
        <i className="fa-solid fa-circle-plus" /> Register New Asset
      </button>
    </div>
  )
}
