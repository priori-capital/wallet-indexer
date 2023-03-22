-- Up Migration

CREATE TABLE user_activities (
    id bigserial NOT NULL,
	hash BYTEA,
    -- direction text,
    type text NOT NULL,
    contract BYTEA,
    -- address BYTEA,
    from_address BYTEA,
    to_address BYTEA,
    amount NUMERIC(78),
    metadata text,
    block_hash BYTEA,
    block INT,
    event_timestamp INT,
    chain_id INT,
    created_at timestamp with time zone DEFAULT NOW(),
    CONSTRAINT user_activities_pk PRIMARY KEY (hash, from_address, to_address, chain_id)
);

CREATE INDEX user_activities_from_address_event_timestamp_type_index
    ON user_activities (from_address, event_timestamp DESC NULLS LAST, type);

CREATE INDEX user_activities_from_address_created_at_type_index
    ON user_activities (from_address, created_at DESC NULLS LAST, type);

CREATE INDEX user_activities_to_address_event_timestamp_type_index
    ON user_activities (to_address, event_timestamp DESC NULLS LAST, type);

CREATE INDEX user_activities_to_address_created_at_type_index
    ON user_activities (to_address, created_at DESC NULLS LAST, type);

CREATE UNIQUE INDEX user_activities_hash_address_unique_index
    ON user_activities (hash, from_address, to_address);

CREATE INDEX user_activities_block_hash_index
    ON user_activities (block_hash);

-- Down Migration

DROP TABLE user_activities;
