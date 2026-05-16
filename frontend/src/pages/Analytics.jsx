import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Analytics({ shortCode }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/api/analytics/${shortCode}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [shortCode])

  if (loading) return <p style={{ padding: 40 }}>Loading analytics...</p>
  if (error) return <p style={{ padding: 40, color: 'red' }}>Error: {error}</p>

  const chartData = {
    labels: data.history.map(h => {
      const d = new Date(h.hour)
      return d.toLocaleDateString() + ' ' + d.getHours() + ':00'
    }),
    datasets: [{
      label: 'Clicks per hour',
      data: data.history.map(h => h.clicks),
      backgroundColor: '#4F46E5',
      borderRadius: 4
    }]
  }

  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 20px', fontFamily: 'system-ui' }}>
      <a href="/" style={{ color: '#6B7280', fontSize: 14 }}>Back</a>
      <h1 style={{ marginTop: 12 }}>Analytics: <code>{shortCode}</code></h1>
      <p style={{ fontSize: 18 }}>
        Total clicks: <strong style={{ color: '#4F46E5' }}>{data.total_clicks}</strong>
      </p>
      {data.history.length === 0 ? (
        <p style={{ color: '#9CA3AF' }}>No clicks yet. Visit the short URL first.</p>
      ) : (
        <div data-testid="analytics-chart" style={{ marginTop: 24 }}>
          <Bar data={chartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Clicks over time' }
            },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
          }} />
        </div>
      )}
      {data.history.length === 0 && (
        <div data-testid="analytics-chart" style={{ display: 'none' }} />
      )}
    </div>
  )
}