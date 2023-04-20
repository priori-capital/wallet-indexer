-- Up Migration

TRUNCATE TABLE public.tracked_wallets;

ALTER TABLE public.tracked_wallets ADD COLUMN "account_id" varchar NOT NULL;
ALTER TABLE public.tracked_wallets ADD COLUMN "deleted_at" timestamp without time zone NULL;

-- Down Migration

ALTER TABLE public.tracked_wallets DROP COLUMN "account_id";
ALTER TABLE public.tracked_wallets DROP COLUMN "deleted_at";