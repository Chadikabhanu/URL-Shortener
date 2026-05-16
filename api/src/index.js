require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const Redis = require('ioredis');
const { generateHashCode, generateSnowflakeCode } = require('./utils/idgen');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const db = new Pool({ connectionString: process.env.DATABASE_URL });
const redis = new Redis(process.env.REDIS_URL);
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CACHE_TTL = 86400;

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// POST /api/shorten
app.post('/api/shorten', async (req, res) => {
  try {
    const { url, strategy, expires_at } = req.body;
    const strat = strategy || 'hash';
    if (!url) return res.status(400).json({ error: 'url is required' });

    let shortCode;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
      shortCode = strat === 'snowflake'
        ? generateSnowflakeCode()
        : generateHashCode(url, attempts > 0 ? String(attempts) : '');
      try {
        await db.query(
          `INSERT INTO urls (short_code, original_url, strategy, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [shortCode, url, strat, expires_at || null]
        );
        break;
      } catch (err) {
        if (err.code === '23505') { attempts++; continue; }
        throw err;
      }
    }

    return res.status(201).json({ short_url: `${BASE_URL}/${shortCode}` });
  } catch (err) {
    console.error('Shorten error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/:shortCode — must be BEFORE /:shortCode
app.get('/api/analytics/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const result = await db.query(
      `SELECT hour, click_count FROM analytics_hourly
       WHERE short_code = $1 ORDER BY hour ASC`,
      [shortCode]
    );
    const total = result.rows.reduce((sum, r) => sum + parseInt(r.click_count), 0);
    return res.json({
      total_clicks: total,
      history: result.rows.map(r => ({ hour: r.hour, clicks: r.click_count }))
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /:shortCode — redirect
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Check Redis cache first
    const cached = await redis.get('url:' + shortCode);
    if (cached) {
      res.set('X-Cache-Status', 'HIT');
      await publishClick(shortCode, req.headers['user-agent']);
      return res.redirect(302, cached);
    }

    // Cache miss — query DB
    const result = await db.query(
      `SELECT original_url, expires_at FROM urls WHERE short_code = $1`,
      [shortCode]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Not found' });
    }

    const { original_url, expires_at } = result.rows[0];
    if (expires_at && new Date(expires_at) < new Date()) {
      return res.status(404).json({ error: 'Link expired' });
    }

    await redis.setex('url:' + shortCode, CACHE_TTL, original_url);
    res.set('X-Cache-Status', 'MISS');
    await publishClick(shortCode, req.headers['user-agent']);
    return res.redirect(302, original_url);
  } catch (err) {
    console.error('Redirect error:', err);
    return res.status(500).json({ error: err.message });
  }
});

async function publishClick(shortCode, userAgent) {
  try {
    await redis.xadd('clicks', '*',
      'short_code', shortCode,
      'timestamp', new Date().toISOString(),
      'user_agent', userAgent || ''
    );
  } catch (err) {
    console.error('Stream publish error:', err);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('API running on port ' + PORT));