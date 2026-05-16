CREATE TABLE IF NOT EXISTS urls (
    id          SERIAL PRIMARY KEY,
    short_code  VARCHAR(16)  NOT NULL UNIQUE,
    original_url TEXT        NOT NULL,
    strategy    VARCHAR(16)  NOT NULL CHECK (strategy IN ('hash', 'snowflake')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS analytics_hourly (
    id          SERIAL PRIMARY KEY,
    short_code  VARCHAR(16)  NOT NULL,
    hour        TIMESTAMPTZ  NOT NULL,
    click_count INTEGER      NOT NULL DEFAULT 1,
    UNIQUE (short_code, hour)
);

CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_analytics_short_code ON analytics_hourly(short_code);
