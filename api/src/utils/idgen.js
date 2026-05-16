const crypto = require('crypto');

// --- Hash Strategy ---
function generateHashCode(url, salt) {
  salt = salt || '';
  const input = url + salt + Date.now();
  const hash = crypto.createHash('md5').update(input).digest();
  return toBase62(hash.readBigUInt64BE(0)).slice(0, 8);
}

// --- Snowflake Strategy ---
const EPOCH = 1700000000000n;
let sequence = 0n;
let lastMs = 0n;

function generateSnowflakeCode() {
  const nodeId = BigInt(process.env.NODE_ID || 1) & 0x3FFn;
  let ms = BigInt(Date.now()) - EPOCH;
  if (ms === lastMs) {
    sequence = (sequence + 1n) & 0xFFFn;
    if (sequence === 0n) {
      while (BigInt(Date.now()) - EPOCH <= ms) {}
      ms = BigInt(Date.now()) - EPOCH;
    }
  } else {
    sequence = 0n;
  }
  lastMs = ms;
  const id = (ms << 22n) | (nodeId << 12n) | sequence;
  return toBase62(id);
}

// --- Base62 encoder ---
const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function toBase62(num) {
  if (num === 0n) return '0';
  let result = '';
  while (num > 0n) {
    result = CHARS[Number(num % 62n)] + result;
    num = num / 62n;
  }
  return result;
}

module.exports = { generateHashCode, generateSnowflakeCode };