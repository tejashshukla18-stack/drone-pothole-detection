import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

const GRID_COLOR = 'rgba(255, 255, 255, 0.07)'
const TICK_COLOR = '#94a3b8'

// Shared hook: creates a Chart.js instance once, destroys it on unmount or
// when config changes to avoid duplicate/leaked instances across re-renders.
function useChartInstance(canvasRef, buildConfig, deps) {
  const chartRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    chartRef.current = new Chart(canvas.getContext('2d'), buildConfig())

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export function SeverityDoughnutChart({ severityDistribution }) {
  const canvasRef = useRef(null)
  const sevData = [
    severityDistribution.high_p1 || 0,
    severityDistribution.medium_p2 || 0,
    severityDistribution.low_p3 || 0,
  ]
  const hasData = sevData.some((v) => v > 0)

  useChartInstance(
    canvasRef,
    () => ({
      type: 'doughnut',
      data: {
        labels: ['P1 - Immediate Repair', 'P2 - Scheduled Maintenance', 'P3 - Routine Inspection'],
        datasets: [
          {
            data: hasData ? sevData : [0, 0, 0],
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
            borderColor: '#131824',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: TICK_COLOR, font: { size: 11 } } },
        },
      },
    }),
    [sevData.join(',')],
  )

  return <canvas ref={canvasRef} />
}

export function TrendsLineChart({ trends }) {
  const canvasRef = useRef(null)

  useChartInstance(
    canvasRef,
    () => ({
      type: 'line',
      data: {
        labels: trends.map((t) => t.month),
        datasets: [
          {
            label: 'Potholes Detected',
            data: trends.map((t) => t.defects_detected),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Repairs Completed',
            data: trends.map((t) => t.repairs_done),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
          y: { ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
        },
        plugins: {
          legend: { labels: { color: TICK_COLOR } },
        },
      },
    }),
    [JSON.stringify(trends)],
  )

  return <canvas ref={canvasRef} />
}

export function AssetHealthBarChart({ assetTypeDistribution }) {
  const canvasRef = useRef(null)

  useChartInstance(
    canvasRef,
    () => ({
      type: 'bar',
      data: {
        labels: ['Roads', 'Bridges', 'Buildings', 'Municipal Surfaces'],
        datasets: [
          {
            label: 'Assets Count',
            data: [
              assetTypeDistribution.roads || 0,
              assetTypeDistribution.bridges || 0,
              assetTypeDistribution.buildings || 0,
              assetTypeDistribution.municipal_surfaces || 0,
            ],
            backgroundColor: ['#e07a38', '#38bdf8', '#f59e0b', '#10b981'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: TICK_COLOR }, grid: { color: GRID_COLOR } },
          y: { ticks: { color: TICK_COLOR }, beginAtZero: true, grid: { color: GRID_COLOR } },
        },
        plugins: {
          legend: { display: false },
        },
      },
    }),
    [JSON.stringify(assetTypeDistribution)],
  )

  return <canvas ref={canvasRef} />
}
