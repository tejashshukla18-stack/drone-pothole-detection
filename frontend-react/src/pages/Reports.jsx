import { useCallback, useEffect, useState } from 'react'
import { fetchReports, fetchReportDetail, generateReport } from '../api/reports.js'
import { useToast } from '../context/ToastContext.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import ReportsList from '../components/reports/ReportsList.jsx'
import ReportPreview from '../components/reports/ReportPreview.jsx'

export default function Reports() {
  const { showToast } = useToast()

  const [listStatus, setListStatus] = useState('loading') // loading | success | error
  const [reports, setReports] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const [previewStatus, setPreviewStatus] = useState('idle') // idle | loading | success | error
  const [report, setReport] = useState(null)

  const [isGenerating, setGenerating] = useState(false)

  const loadPreview = useCallback(async (id) => {
    if (!id) {
      setPreviewStatus('idle')
      setReport(null)
      return
    }
    setPreviewStatus('loading')
    try {
      const data = await fetchReportDetail(id)
      setReport(data.report)
      setPreviewStatus('success')
    } catch (err) {
      console.error('Error loading report preview:', err)
      setPreviewStatus('error')
    }
  }, [])

  const loadList = useCallback(async () => {
    setListStatus('loading')
    try {
      const data = await fetchReports()
      setReports(data)
      setListStatus('success')
      if (data.length > 0) {
        setSelectedId(data[0].id)
        loadPreview(data[0].id)
      } else {
        setSelectedId(null)
        setPreviewStatus('idle')
        setReport(null)
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setListStatus('error')
    }
  }, [loadPreview])

  useEffect(() => {
    loadList()
    // Only run once on mount — subsequent refreshes happen explicitly via
    // loadList()/handleSelect() so we don't re-select the newest report out
    // from under the user while they're reading a different one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(id) {
    setSelectedId(id)
    loadPreview(id)
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const newReport = await generateReport({
        notes: 'Consolidated aerial inspection dossier generated from Reports page.',
      })
      showToast(`Certified Engineering Report "${newReport.report_number}" generated!`, 'success')
      await loadList()
      setSelectedId(newReport.id)
      await loadPreview(newReport.id)
    } catch (err) {
      console.error('Error generating report:', err)
      showToast(err.message || 'Failed to generate report.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[17px] font-bold text-text-primary">
            <i className="fa-solid fa-file-pdf text-accent-blue" /> Municipal Pavement Inspection
            Reports
          </h2>
          <p className="mt-1 text-[13px] text-text-muted">
            Certified civil engineering dossiers and compliance documentation
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <i className={isGenerating ? 'fa-solid fa-circle-notch fa-spin' : 'fa-solid fa-file-circle-plus'} />
          {isGenerating ? 'Generating...' : 'Generate New Dossier'}
        </button>
      </div>

      {listStatus === 'loading' && <Spinner label="Loading reports..." />}

      {listStatus === 'error' && (
        <ErrorState
          title="Unable to load reports"
          message="Published dossiers could not be retrieved from the server."
          onRetry={loadList}
        />
      )}

      {listStatus === 'success' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm lg:max-h-[80vh] lg:overflow-y-auto">
            <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-text-primary">
              <i className="fa-solid fa-folder text-accent-blue" /> Published Dossiers
            </h3>
            <ReportsList reports={reports} selectedId={selectedId} onSelect={handleSelect} />
          </div>

          <ReportPreview
            status={previewStatus}
            report={report}
            onGenerate={handleGenerate}
            onRetry={() => loadPreview(selectedId)}
          />
        </div>
      )}
    </div>
  )
}
