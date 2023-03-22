-- Up Migration

ALTER TABLE public.transactions_1 ADD COLUMN "gas_limit" numeric NULL;
ALTER TABLE public.transactions_1 ADD COLUMN "nonce" int4 NULL;
ALTER TABLE public.transactions_1 ADD COLUMN "status" int2 NULL;

ALTER TABLE public.transactions_137 ADD COLUMN "gas_limit" numeric NULL;
ALTER TABLE public.transactions_137 ADD COLUMN "nonce" int4 NULL;
ALTER TABLE public.transactions_137 ADD COLUMN "status" int2 NULL;


-- Down Migration

ALTER TABLE public.transactions_1 DROP COLUMN "gas_limit";
ALTER TABLE public.transactions_1 DROP COLUMN "nonce";
ALTER TABLE public.transactions_1 DROP COLUMN "status";

ALTER TABLE public.transactions_137 DROP COLUMN "gas_limit";
ALTER TABLE public.transactions_137 DROP COLUMN "nonce";
ALTER TABLE public.transactions_137 DROP COLUMN "status";
