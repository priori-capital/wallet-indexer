-- Up Migration

CREATE TABLE "accounts" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "email" VARCHAR NOT NULL,
  "secret_key" VARCHAR NULL,
  "webhook_url" VARCHAR NOT NULL,
  "webhook_auth_key" VARCHAR NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT NOW()
);

CREATE UNIQUE INDEX unique_email
ON accounts(email);

-- Down Migration

DROP TABLE "accounts";
