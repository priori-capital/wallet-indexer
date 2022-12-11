-- Up Migration

CREATE TABLE "blocks_1" (
  "hash" BYTEA NOT NULL,
  "number" INT NOT NULL,
  "timestamp" INT
);

CREATE TABLE "blocks_137" (
  "hash" BYTEA NOT NULL,
  "number" INT NOT NULL,
  "timestamp" INT
);

ALTER TABLE "blocks_1"
  ADD CONSTRAINT "blocks_1_pk"
  PRIMARY KEY ("number", "hash");

ALTER TABLE "blocks_137"
  ADD CONSTRAINT "blocks_137_pk"
  PRIMARY KEY ("number", "hash");


-- Down Migration

DROP TABLE "blocks_1";

DROP TABLE "blocks_137";
