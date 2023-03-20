-- Up Migration

ALTER TABLE public.transactions_1 ADD COLUMN "nonce" int4 NULL;
ALTER TABLE public.transactions_1 ADD COLUMN "status" int2 NULL DEFAULT 1;

ALTER TABLE public.transactions_137 ADD COLUMN "nonce" int4 NULL;
ALTER TABLE public.transactions_137 ADD COLUMN "status" int2 NULL DEFAULT 1;


-- Down Migration

ALTER TABLE public.transactions_1 DROP COLUMN "nonce";
ALTER TABLE public.transactions_1 DROP COLUMN "status";

ALTER TABLE public.transactions_137 DROP COLUMN "nonce";
ALTER TABLE public.transactions_137 DROP COLUMN "status";
