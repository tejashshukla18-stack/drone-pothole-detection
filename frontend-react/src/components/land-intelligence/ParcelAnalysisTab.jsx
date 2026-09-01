import { useMemo, useState } from 'react'
import EmptyState from '../ui/EmptyState.jsx'
import FormField from '../ui/FormField.jsx'
import RiskBadge from './RiskBadge.jsx'
import {
  DISTRICTS,
  ENCROACHMENT_TYPES,
  LAND_TYPES,
  RISK_LEVELS,
  STATUSES,
  TEHSILS,
  VILLAGES,
} from '../../data/landIntelligenceData.js'
import {
  formatArea,
  formatDate,
  getDisplayRiskLevel,
  getStatusBadgeClasses,
} from './landIntelligenceHelpers.js'

const EMPTY_FILTERS = {
  parcelId: '',
  surveyNumber: '',
  district: 'all',
  tehsil: 'all',
  village: 'all',
  landType: 'all',
  risk: 'all',
  encroachmentType: 'all',
  status: 'all',
}

const COLUMNS = [
  { key: 'parcelId', label: 'Parcel ID', sortable: true },
  { key: 'surveyNumber', label: 'Survey No.', sortable: true },
  { key: 'landType', label: 'Land Type', sortable: true },
  { key: 'authorizedArea', label: 'Authorized Area', sortable: true },
  { key: 'detectedArea', label: 'Detected Area', sortable: true },
  { key: 'encroachmentArea', label: 'Potential Encroachment', sortable: true },
  { key: 'encroachmentPercentage', label: 'Encroachment %', sortable: true },
  { key: 'riskLevel', label: 'Risk', sortable: true },
  { key: 'confidence', label: 'Confidence', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'lastInspected', label: 'Last Inspected', sortable: true },
]

const RISK_SORT_ORDER = { Low: 0, Medium: 1, High: 2 }
const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function ParcelAnalysisTab({ parcels, onSelectParcel }) {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [sortKey, setSortKey] = useState('lastInspected')
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  function updateDraft(key, value) {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
  }

  function applyFilters() {
    setFilters(draftFilters)
    setPage(1)
  }

  function resetFilters() {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const parcelIdQuery = filters.parcelId.trim().toLowerCase()
    const surveyQuery = filters.surveyNumber.trim().toLowerCase()

    return (parcels || []).filter((p) => {
      if (parcelIdQuery && !p.parcelId.toLowerCase().includes(parcelIdQuery)) return false
      if (surveyQuery && !p.surveyNumber.toLowerCase().includes(surveyQuery)) return false
      if (filters.district !== 'all' && p.district !== filters.district) return false
      if (filters.tehsil !== 'all' && p.tehsil !== filters.tehsil) return false
      if (filters.village !== 'all' && p.village !== filters.village) return false
      if (filters.landType !== 'all' && p.landType !== filters.landType) return false
      if (filters.risk !== 'all' && p.riskLevel !== filters.risk) return false
      if (filters.encroachmentType !== 'all' && p.type !== filters.encroachmentType) return false
      if (filters.status !== 'all' && p.status !== filters.status) return false
      return true
    })
  }, [parcels, filters])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]

      if (sortKey === 'riskLevel') {
        av = RISK_SORT_ORDER[a.riskLevel] ?? -1
        bv = RISK_SORT_ORDER[b.riskLevel] ?? -1
      } else if (sortKey === 'lastInspected') {
        av = new Date(a.lastInspected).getTime()
        bv = new Date(b.lastInspected).getTime()
      } else if (typeof av === 'string') {
        av = av.toLowerCase()
        bv = bv.toLowerCase()
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize],
  )

  function sortIcon(key) {
    if (sortKey !== key) return 'fa-sort text-text-muted/50'
    return sortDir === 'asc' ? 'fa-sort-up text-accent-blue' : 'fa-sort-down text-accent-blue'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-text-primary">
          <i className="fa-solid fa-filter text-accent-blue" /> Filters
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FormField
            label="Search Parcel ID"
            placeholder="e.g. PCL-10231"
            value={draftFilters.parcelId}
            onChange={(e) => updateDraft('parcelId', e.target.value)}
          />
          <FormField
            label="Search Survey Number"
            placeholder="e.g. 142/3"
            value={draftFilters.surveyNumber}
            onChange={(e) => updateDraft('surveyNumber', e.target.value)}
          />
          <FormField
            label="District"
            as="select"
            value={draftFilters.district}
            onChange={(e) => updateDraft('district', e.target.value)}
            options={[{ value: 'all', label: 'All Districts' }, ...DISTRICTS.map((d) => ({ value: d, label: d }))]}
          />
          <FormField
            label="Tehsil"
            as="select"
            value={draftFilters.tehsil}
            onChange={(e) => updateDraft('tehsil', e.target.value)}
            options={[{ value: 'all', label: 'All Tehsils' }, ...TEHSILS.map((t) => ({ value: t, label: t }))]}
          />
          <FormField
            label="Village"
            as="select"
            value={draftFilters.village}
            onChange={(e) => updateDraft('village', e.target.value)}
            options={[{ value: 'all', label: 'All Villages' }, ...VILLAGES.map((v) => ({ value: v, label: v }))]}
          />
          <FormField
            label="Land Type"
            as="select"
            value={draftFilters.landType}
            onChange={(e) => updateDraft('landType', e.target.value)}
            options={[{ value: 'all', label: 'All Land Types' }, ...LAND_TYPES.map((t) => ({ value: t, label: t }))]}
          />
          <FormField
            label="Risk"
            as="select"
            value={draftFilters.risk}
            onChange={(e) => updateDraft('risk', e.target.value)}
            options={[{ value: 'all', label: 'All Risk Levels' }, ...RISK_LEVELS.map((r) => ({ value: r, label: r }))]}
          />
          <FormField
            label="Encroachment Type"
            as="select"
            value={draftFilters.encroachmentType}
            onChange={(e) => updateDraft('encroachmentType', e.target.value)}
            options={[
              { value: 'all', label: 'All Encroachment Types' },
              ...ENCROACHMENT_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />
          <FormField
            label="Status"
            as="select"
            value={draftFilters.status}
            onChange={(e) => updateDraft('status', e.target.value)}
            options={[{ value: 'all', label: 'All Statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-sm border border-border bg-bg-card px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-sm bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-blue-hover"
          >
            <i className="fa-solid fa-check mr-1.5" /> Apply Filters
          </button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
              <i className="fa-solid fa-table-list text-accent-blue" /> Parcel Analysis
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">
              {sorted.length} of {parcels.length} demo parcels matching current filters
            </p>
          </div>
          <FormField
            as="select"
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            options={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: `${n} / page` }))}
            className="w-32"
          />
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon="fa-solid fa-filter-circle-xmark"
            title="No Parcels Match Your Filters"
            message="Try adjusting the search term or clearing a filter to see more results."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-input text-[11px] uppercase tracking-wide text-text-muted">
                    {COLUMNS.map((col) => (
                      <th key={col.key} className="px-4 py-3 font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-text-primary"
                        >
                          {col.label}
                          <i className={`fa-solid ${sortIcon(col.key)} text-[10px]`} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <tr
                      key={p.parcelId}
                      onClick={() => onSelectParcel?.(p)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-bg-card-hover"
                    >
                      <td className="px-4 py-3 font-bold text-text-primary">{p.parcelId}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.surveyNumber}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.landType}</td>
                      <td className="px-4 py-3 text-text-secondary">{formatArea(p.authorizedArea)}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        {formatArea(p.detectedArea)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{formatArea(p.encroachmentArea)}</td>
                      <td className="px-4 py-3 text-text-secondary">{p.encroachmentPercentage}%</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={getDisplayRiskLevel(p)} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{p.confidence}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClasses(
                            p.status,
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{formatDate(p.lastInspected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-text-muted">
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-sm border border-border bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <span className="text-[12px] font-semibold text-text-primary">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-sm border border-border bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg-card-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
