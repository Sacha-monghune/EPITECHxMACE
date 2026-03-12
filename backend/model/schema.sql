-- Version moderne PostgreSQL
CREATE TABLE picture (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    latitude    NUMERIC(9, 6)   NOT NULL,
    longitude   NUMERIC(9, 6)   NOT NULL,
    path        TEXT            NOT NULL,
    commentary  TEXT,
    timestamp   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);