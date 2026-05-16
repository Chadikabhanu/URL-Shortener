import { useState } from 'react'
import Analytics from './pages/Analytics'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function App() {
  const [url, setUrl] = useState('')
  const [strategy, setStrategy] = useState('hash')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const path = window.location.pathname
  if (path.startsWith('/analytics/')) {
    const code = path.split('/').pop()
    return <Analytics shortCode={code} />
  }

  const shorten = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, strategy })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShortUrl(data.short_url)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 4 }}>URL Shortener</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Distributed · Collision-resistant · Analytics</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          data-testid="url-input"
          type="url"
          placeholder="https://example.com/very-long-url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && shorten()}
          style={{ padding: '10px 14px', fontSize: 15, border: '1px solid #ccc', borderRadius: 8, outline: 'none' }}
        />

        <select
          data-testid="strategy-select"
          value={strategy}
          onChange={e => setStrategy(e.target.value)}
          style={{ padding: '10px 14px', fontSize: 15, border: '1px solid #ccc', borderRadius: 8 }}
        >
          <option value="hash">Hash (MD5-based)</option>
          <option value="snowflake">Snowflake (distributed ID)</option>
        </select>

        <button
          data-testid="shorten-button"
          onClick={shorten}
          disabled={!url || loading}
          style={{
            padding: 12, fontSize: 15, background: loading ? '#9CA3AF' : '#4F46E5',
            color: '#fff', border: 'none', borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
          }}
        >
          {loading ? 'Shortening...' : 'Shorten URL'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#B91C1C' }}>
          {error}
        </div>
      )}

      <div data-testid="result-display">
        {shortUrl && (
          <div style={{ marginTop: 24, padding: 16, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8 }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#166534' }}>Your short URL:</p>
            <a href={shortUrl} target="_blank" rel="noreferrer"
              style={{ color: '#16A34A', wordBreak: 'break-all', fontSize: 15 }}>
              {shortUrl}
            </a>
            <br />
            <a href={'/analytics/' + shortUrl.split('/').pop()}
              style={{ fontSize: 13, color: '#6B7280', marginTop: 8, display: 'inline-block' }}>
              View analytics →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}