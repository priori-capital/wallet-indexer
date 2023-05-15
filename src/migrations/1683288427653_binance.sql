-- Up Migration
CREATE TABLE public.blocks_56 (
	hash bytea NOT NULL,
	"number" int4 NOT NULL,
	"timestamp" int4 NULL,
	CONSTRAINT blocks_56_pk PRIMARY KEY (number, hash)
);

CREATE TABLE public.transaction_logs_56 (
	hash bytea NOT NULL,
	logs jsonb NOT NULL,
	CONSTRAINT transaction_logs_56_pk PRIMARY KEY (hash)
);

CREATE TABLE public.transaction_traces_56 (
	hash bytea NOT NULL,
	calls jsonb NOT NULL,
	CONSTRAINT transaction_traces_56_pk PRIMARY KEY (hash)
);

CREATE TABLE public.transactions_56 (
	hash bytea NOT NULL,
	"from" bytea NOT NULL,
	"to" bytea NOT NULL,
	value numeric NOT NULL,
	"data" bytea NULL,
	block_number int4 NULL,
	block_timestamp int4 NULL,
	gas_used numeric NULL,
	gas_price numeric NULL,
	gas_fee numeric NULL,
	gas_limit numeric NULL,
	nonce int4 NULL,
	status int2 NULL,
	CONSTRAINT transactions_56_pk PRIMARY KEY (hash)
);
CREATE INDEX transactions_56_to_index ON public.transactions_56 USING btree ("to");


-- Down Migration
DROP TABLE public.blocks_56;
DROP TABLE public.transaction_logs_56;
DROP TABLE public.transaction_traces_56;
DROP TABLE public.transactions_56;