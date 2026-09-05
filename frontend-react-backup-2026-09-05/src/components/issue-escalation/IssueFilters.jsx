import FormField from '../ui/FormField.jsx'

function uniqueOptions(values, allLabel) {
  const unique = Array.from(new Set(values.filter(Boolean))).sort()
  return [{ value: '', label: allLabel }, ...unique.map((v) => ({ value: v, label: v }))]
}

// Filters per the Issue Escalation spec: Severity, Status, Authority,
// Department, Asset, Issue Type, Location, Date. "Authority" and
// "Department" share one value in this data model (an Authority IS a
// department), so they're combined into a single filter rather than two
// filters over the same field.
export default function IssueFilters({ tickets, filters, onChange }) {
  const severityOptions = uniqueOptions(tickets.map((t) => t.severity), 'All Severities')
  const statusOptions = uniqueOptions(tickets.map((t) => t.status), 'All Statuses')
  const authorityOptions = uniqueOptions(tickets.map((t) => t.department), 'All Authorities / Departments')
  const assetOptions = uniqueOptions(tickets.map((t) => t.assetName), 'All Assets')
  const issueTypeOptions = uniqueOptions(tickets.map((t) => t.issueType), 'All Issue Types')

  function update(field, value) {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      <FormField as="select" label="Severity" options={severityOptions} value={filters.severity} onChange={(e) => update('severity', e.target.value)} />
      <FormField as="select" label="Status" options={statusOptions} value={filters.status} onChange={(e) => update('status', e.target.value)} />
      <FormField as="select" label="Authority / Department" options={authorityOptions} value={filters.authority} onChange={(e) => update('authority', e.target.value)} />
      <FormField as="select" label="Asset" options={assetOptions} value={filters.asset} onChange={(e) => update('asset', e.target.value)} />
      <FormField as="select" label="Issue Type" options={issueTypeOptions} value={filters.issueType} onChange={(e) => update('issueType', e.target.value)} />
      <FormField
        label="Location contains"
        placeholder="e.g. Ward 12"
        value={filters.location}
        onChange={(e) => update('location', e.target.value)}
      />
      <FormField label="Created after" type="date" value={filters.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} />
    </div>
  )
}
