import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '2m',  target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = 'http://localhost:3000';
const URLS = ['https://google.com', 'https://github.com', 'https://wikipedia.org'];

export function setup() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const res = http.post(
      `${BASE}/api/shorten`,
      JSON.stringify({ url: URLS[i % URLS.length], strategy: i % 2 === 0 ? 'hash' : 'snowflake' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.status === 201) {
      codes.push(JSON.parse(res.body).short_url.split('/').pop());
    }
  }
  return { codes };
}

export default function (data) {
  if (Math.random() < 0.3) {
    const res = http.post(
      `${BASE}/api/shorten`,
      JSON.stringify({
        url: URLS[Math.floor(Math.random() * URLS.length)],
        strategy: Math.random() > 0.5 ? 'hash' : 'snowflake'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(res, { 'shorten 201': r => r.status === 201 });
  } else if (data.codes.length > 0) {
    const code = data.codes[Math.floor(Math.random() * data.codes.length)];
    const res = http.get(`${BASE}/${code}`, { redirects: 0 });
    check(res, {
      'redirect 302': r => r.status === 302,
      'has cache header': r => r.headers['X-Cache-Status'] !== undefined,
    });
  }
  sleep(0.1);
}