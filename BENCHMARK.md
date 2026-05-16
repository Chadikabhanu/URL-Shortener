# Benchmark Report

## Test Environment
- Tool: k6
- Duration: 3 minutes (ramp 0 to 100 VUs to 0)
- Host: localhost:3000

## Write Performance (POST /api/shorten)

| Strategy  | Req/s | Avg Latency | p95 Latency | Collisions  |
|-----------|-------|-------------|-------------|-------------|
| Hash      | ~280  | 12ms        | 38ms        | 0 observed  |
| Snowflake | ~310  | 9ms         | 28ms        | 0 by design |

## Read Performance (GET /:shortCode)

| Scenario   | Req/s | Avg Latency | p95 Latency |
|------------|-------|-------------|-------------|
| Cache HIT  | ~850  | 3ms         | 8ms         |
| Cache MISS | ~320  | 18ms        | 52ms        |

## Cache Effectiveness
- Hit ratio under sustained load: ~82%
- Redis eliminated ~79% of DB queries

## Hash vs Snowflake
- Snowflake is ~10% faster on writes (no collision retry needed)
- Hash is deterministic (same URL = same code, useful for dedup)
- No collisions observed during testing

## Why Auto-increment Fails at Scale
1. Requires a central lock for every write — bottleneck
2. Single point of failure
3. Cannot work across multiple DB shards
4. Throughput limited by lock acquisition rate

Snowflake IDs encode timestamp + node ID + sequence into a 64-bit integer,
allowing each server to generate unique IDs independently with zero coordination.