import { useCallback, useEffect, useState } from 'react'
import { fetchInsights } from '../../api/insights.js'
import Spinner from '../ui/Spinner.jsx'
import ErrorState from '../ui/ErrorState.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import { SeverityDoughnutChart, TrendsLineChart, AssetHealthBarChart } from './InsightsCharts.jsx'
import DefectHeatmap from './DefectHeatmap.jsx'

function ChartCard({ icon, title, subtitle, children }) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-[14px] font-bold text-text-primary">
          <i className={`${icon} text-accent-blue`} /> {title}
        </h3>
        <p className="mt-0.5 text-[12px] text-text-muted">{subtitle}</p>
      </div>
      <div className="h-[260px]">{children}</div>
    </div>
  )
}

export default function InsightsTab() {
  const [status, setStatus] = useState('loading') // loading | success | error
  const [insights, setInsights] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchInsights()
      setInsights(data)
      setStatus('success')
    } catch (err) {
      console.error('Error fetching insights:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (status === 'loading') {
    return <Spinner label="Loading analytics..." />
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Unable to load insights"
        message="Analytics could not be retrieved from the server."
        onRetry={load}
      />
    )
  }

  const severity = insights?.severity_distribution || { high_p1: 0, medium_p2: 0, low_p3: 0 }
  const trends = insights?.inspection_trends || []
  const assetTypes = insights?.asset_type_distribution || {}
  const clusters = insights?.gis_defect_clusters || []
  const hasAnyData =
    severity.high_p1 + severity.medium_p2 + severity.low_p3 > 0 ||
    Object.values(assetTypes).some((v) => v > 0) ||
    clusters.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="flex items-center gap-2 text-[17px] font-bold text-text-primary">
          <i className="fa-solid fa-chart-line text-accent-blue" /> Insights &amp; Analytics
        </h2>
        <p className="mt-1 text-[13px] text-text-muted">
          Portfolio-wide defect trends, asset health, and regional risk concentration
        </p>
      </div>

      {!hasAnyData ? (
        <EmptyState
          icon="fa-solid fa-chart-line"
          title="No analytics data yet"
          message="Register assets and run inspections to populate severity, trend, and health analytics here."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard
              icon="fa-solid fa-chart-pie"
              title="Defect Severity Breakdown (P1 / P2 / P3)"
              subtitle="Triage distribution of all detected asphalt cavities"
            >
              <SeverityDoughnutChart severityDistribution={severity} />
            </ChartCard>

            <ChartCard
              icon="fa-solid fa-chart-line"
              title="Inspection Missions & Defects Over Time"
              subtitle="6-month trend of drone flight findings and completed repairs"
            >
              <TrendsLineChart trends={trends} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard
              icon="fa-solid fa-chart-column"
              title="Asset Health Score by Category"
              subtitle="Structural index ratings across Roads, Bridges, and Municipal Areas"
            >
              <AssetHealthBarChart assetTypeDistribution={assetTypes} />
            </ChartCard>

            <div className="flex flex-col rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
              <div className="mb-3">
                <h3 className="flex items-center gap-2 text-[14px] font-bold text-text-primary">
                  <i className="fa-solid fa-fire-flame-curved text-accent-blue" /> Regional Cavity
                  Density Heatmap
                </h3>
                <p className="mt-0.5 text-[12px] text-text-muted">
                  Geographic concentration of structural road hazards
                </p>
              </div>
              <DefectHeatmap clusters={clusters} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
