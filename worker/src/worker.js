require('dotenv').config();
const Redis = require('ioredis');
const { Pool } = require('pg');

const redis = new Redis(process.env.REDIS_URL);
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const STREAM = 'clicks';
const GROUP = 'analytics-workers';
const CONSUMER = 'worker-' + process.pid;
const BATCH_SIZE = 100;

async function setup() {
  try {
    await redis.xgroup('CREATE', STREAM, GROUP, '$', 'MKSTREAM');
    console.log('Consumer group created');
  } catch (err) {
    if (!err.message.includes('BUSYGROUP')) throw err;
    console.log('Consumer group already exists');
  }
}

async function processMessages(messages) {
  const counts = {};
  for (const [id, fields] of messages) {
    // fields is a flat array: ['short_code', 'abc', 'timestamp', '...', ...]
    const idx = fields.indexOf('short_code');
    const tsIdx = fields.indexOf('timestamp');
    if (idx === -1 || tsIdx === -1) continue;

    const short_code = fields[idx + 1];
    const timestamp = fields[tsIdx + 1];
    const hour = new Date(timestamp);
    hour.setMinutes(0, 0, 0);
    const key = short_code + '::' + hour.toISOString();

    if (!counts[key]) {
      counts[key] = { short_code, hour: hour.toISOString(), count: 0 };
    }
    counts[key].count++;
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    for (const entry of Object.values(counts)) {
      await client.query(
        `INSERT INTO analytics_hourly (short_code, hour, click_count)
         VALUES ($1, $2, $3)
         ON CONFLICT (short_code, hour)
         DO UPDATE SET click_count = analytics_hourly.click_count + EXCLUDED.click_count`,
        [entry.short_code, entry.hour, entry.count]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function run() {
  await setup();
  console.log('Worker listening for click events...');

  while (true) {
    try {
      const results = await redis.xreadgroup(
        'GROUP', GROUP, CONSUMER,
        'COUNT', BATCH_SIZE,
        'BLOCK', 2000,
        'STREAMS', STREAM, '>'
      );

      if (!results) continue;

      for (const [, messages] of results) {
        if (!messages.length) continue;
        await processMessages(messages);
        const ids = messages.map(function(m) { return m[0]; });
        await redis.xack(STREAM, GROUP, ...ids);
        console.log('Processed ' + ids.length + ' click events');
      }
    } catch (err) {
      console.error('Worker error:', err.message);
      await new Promise(function(r) { setTimeout(r, 1000); });
    }
  }
}

run();