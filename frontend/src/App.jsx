import { useState } from 'react'
import Analytics from './pages/Analytics'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function App() {
  const [url, setUrl] = useState('')
  const [strategy, setStrategy] = useState('hash')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [totalShortened, setTotalShortened] = useState(0)

  const path = window.location.pathname
  if (path.startsWith('/analytics/')) {
    return <Analytics shortCode={path.split('/').pop()} />
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
      setTotalShortened(p => p + 1)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page">
      <div className="card">
        <div className="badge">
          <span className="badge-dot"></span>
          DISTRIBUTED · COLLISION-RESISTANT
        </div>

        <h1>Shorten any URL instantly</h1>
        <p className="subtitle">Powered by Snowflake IDs, Redis cache & real-time analytics</p>

        <div className="form-group">
          <div className="input-wrapper">
            <span className="input-icon">🔗</span>
            <input
              data-testid="url-input"
              type="url"
              placeholder="https://your-very-long-url.com/goes/here"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && url && shorten()}
            />
          </div>

          <div className="input-wrapper">
            <span className="input-icon">⚡</span>
            <select
              data-testid="strategy-select"
              value={strategy}
              onChange={e => setStrategy(e.target.value)}
            >
              <option value="hash">Hash Strategy (MD5-based)</option>
              <option value="snowflake">Snowflake Strategy (Distributed ID)</option>
            </select>
          </div>

          <button
            data-testid="shorten-button"
            className="btn"
            onClick={shorten}
            disabled={!url || loading}
          >
            {loading ? 'Shortening...' : '✨ Shorten URL'}
          </button>
        </div>

        {error && <div className="error-box">⚠️ {error}</div>}

        <div data-testid="result-display">
          {shortUrl && (
            <div className="result-box">
              <div className="result-label">✅ Your short URL is ready</div>
              <div className="result-url">
                <a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a>
                <button className="copy-btn" onClick={copy}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <a className="analytics-link" href={'/analytics/' + shortUrl.split('/').pop()}>
                📊 View click analytics →
              </a>
            </div>
          )}
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{totalShortened}</div>
            <div className="stat-label">URLS SHORTENED</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Redis</div>
            <div className="stat-label">CACHE LAYER</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">24h</div>
            <div className="stat-label">CACHE TTL</div>
          </div>
        </div>
      </div>
    </div>
  )
}