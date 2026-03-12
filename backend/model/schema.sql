CREATE TABLE IF NOT EXISTS picture (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    altitude NUMERIC(8, 2),
    path TEXT NOT NULL,
    original_name TEXT,
    mime_type VARCHAR(100),
    commentary TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE picture
    ADD COLUMN IF NOT EXISTS altitude NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS original_name TEXT,
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
