import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

const GRID_COLOR = '#e2e8f0'
const TICK_COLOR = '#64748b'

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

export function RiskDistributionChart({ riskDistribution }) {
  const canvasRef = useRef(null)

  useChartInstance(
    canvasRef,
    () => ({
      type: 'doughnut',
      data: {
        labels: riskDistribution.map((r) => r.label),
        datasets: [
          {
            data: riskDistribution.map((r) => r.value),
            backgroundColor: riskDistribution.map((r) => r.color),
            borderColor: '#ffffff',
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
    [JSON.stringify(riskDistribution)],
  )

  return <canvas ref={canvasRef} />
}

export function EncroachmentTrendChart({ trend }) {
  const canvasRef = useRef(null)

  useChartInstance(
    canvasRef,
    () => ({
      type: 'line',
      data: {
        labels: trend.map((t) => t.month),
        datasets: [
          {
            label: 'New Encroachments Detected',
            data: trend.map((t) => t.detected),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Cases Resolved/Verified',
            data: trend.map((t) => t.resolved),
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
          y: { ticks: { color: TICK_COLOR }, beginAtZero: true, grid: { color: GRID_COLOR } },
        },
        plugins: {
          legend: { labels: { color: TICK_COLOR } },
        },
      },
    }),
    [JSON.stringify(trend)],
  )

  return <canvas ref={canvasRef} />
}

export function LandTypeDistributionChart({ landTypeDistribution }) {
  const canvasRef = useRef(null)

  useChartInstance(
    canvasRef,
    () => ({
      type: 'bar',
      data: {
        labels: landTypeDistribution.map((l) => l.label),
        datasets: [
          {
            label: 'Encroachment Cases',
            data: landTypeDistribution.map((l) => l.value),
            backgroundColor: '#0284c7',
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: TICK_COLOR }, beginAtZero: true, grid: { color: GRID_COLOR } },
          y: { ticks: { color: TICK_COLOR }, grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
        },
      },
    }),
    [JSON.stringify(landTypeDistribution)],
  )

  return <canvas ref={canvasRef} />
}
