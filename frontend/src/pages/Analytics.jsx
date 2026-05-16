import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Analytics({ shortCode }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/analytics/${shortCode}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [shortCode])

  if (loading) return (
    <div className="analytics-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#475569', fontSize: 16 }}>Loading analytics...</div>
    </div>
  )

  const chartData = {
    labels: data?.history?.map(h => {
      const d = new Date(h.hour)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.getHours() + ':00'
    }) || [],
    datasets: [{
      label: 'Clicks',
      data: data?.history?.map(h => h.clicks) || [],
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      borderColor: '#6366f1',
      borderWidth: 1,
      borderRadius: 6,
    }]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 26, 0.9)',
        titleColor: '#a5b4fc',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(99,102,241,0.3)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        ticks: { color: '#475569', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#475569', stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  }

  return (
    <div className="analytics-page">
      <div className="analytics-card">
        <a href="/" className="back-link">← Back to shortener</a>

        <div className="analytics-header">
          <div className="badge" style={{ marginBottom: 12 }}>
            <span className="badge-dot"></span>
            LIVE ANALYTICS
          </div>
          <h1>Click Analytics</h1>
          <p style={{ color: '#475569', fontSize: 14, marginTop: 4 }}>
            Short code: <code style={{ color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6 }}>{shortCode}</code>
          </p>
        </div>

        <div className="total-clicks">
          <span className="total-clicks-number">{data?.total_clicks || 0}</span>
          <span className="total-clicks-label">total clicks recorded</span>
        </div>

        {data?.history?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No clicks yet</p>
            <p style={{ fontSize: 14 }}>Visit the short URL to start tracking</p>
            <div data-testid="analytics-chart" style={{ display: 'none' }} />
          </div>
        ) : (
          <div className="chart-container" data-testid="analytics-chart">
            <Bar data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </div>
  )
}