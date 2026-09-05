import LandKpiGrid from './LandKpiGrid.jsx'
import {
  EncroachmentTrendChart,
  LandTypeDistributionChart,
  RiskDistributionChart,
} from './LandIntelligenceCharts.jsx'
import RecentDetectionsTable from './RecentDetectionsTable.jsx'

export default function OverviewTab({ overview, onSelectParcel }) {
  const { kpis, riskDistribution, encroachmentTrend, landTypeDistribution, recentDetections } =
    overview

  return (
    <div className="flex flex-col gap-5">
      <LandKpiGrid kpis={kpis} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
          <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-text-primary">
            <i className="fa-solid fa-chart-pie text-accent-blue" /> Risk Distribution
          </h3>
          <div className="h-[240px]">
            <RiskDistributionChart riskDistribution={riskDistribution} />
          </div>
        </div>

        <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
          <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-text-primary">
            <i className="fa-solid fa-chart-line text-accent-blue" /> Encroachment Trend
          </h3>
          <div className="h-[240px]">
            <EncroachmentTrendChart trend={encroachmentTrend} />
          </div>
        </div>

        <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
          <h3 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-text-primary">
            <i className="fa-solid fa-layer-group text-accent-blue" /> Land Type Distribution
          </h3>
          <div className="h-[240px]">
            <LandTypeDistributionChart landTypeDistribution={landTypeDistribution} />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-bg-card p-4 shadow-card-sm">
        <div className="mb-3">
          <h3 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
            <i className="fa-solid fa-list-check text-accent-blue" /> Recent Encroachment Detections
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Latest AI-flagged parcel boundary deviations from drone orthomosaic analysis
          </p>
        </div>
        <RecentDetectionsTable detections={recentDetections} onSelect={onSelectParcel} />
      </div>
    </div>
  )
}
