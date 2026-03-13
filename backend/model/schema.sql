-- Version moderne PostgreSQL

CREATE TABLE location (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            TEXT            NOT NULL,
    description_fr  TEXT,
    description_en  TEXT,
    category        TEXT            NOT NULL CHECK (category IN ('food', 'nature', 'shopping')),
    latitude        NUMERIC(9, 6)   NOT NULL,
    longitude       NUMERIC(9, 6)   NOT NULL,
    main_picture_id BIGINT
);

CREATE TABLE picture (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    location_id BIGINT          NOT NULL,
    path        TEXT            NOT NULL,
    commentary  TEXT,
    timestamp   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_picture_location
        FOREIGN KEY (location_id)
        REFERENCES location(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_picture_id_location
        UNIQUE (id, location_id)
);

ALTER TABLE location
    ADD CONSTRAINT fk_location_main_picture
    FOREIGN KEY (main_picture_id, id)
    REFERENCES picture(id, location_id)
    ON DELETE SET NULL;
