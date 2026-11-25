CREATE SCHEMA "finance";
--> statement-breakpoint
CREATE TYPE "finance"."account_kind" AS ENUM('corrente', 'carteira', 'poupanca', 'credito');--> statement-breakpoint
CREATE TYPE "finance"."cash_direction" AS ENUM('entrada', 'saida');--> statement-breakpoint
CREATE TYPE "finance"."category_kind" AS ENUM('despesa', 'receita', 'neutra');--> statement-breakpoint
CREATE TYPE "finance"."purchase_kind" AS ENUM('compra', 'pix_credito');--> statement-breakpoint
CREATE TABLE "finance"."accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"institution" text DEFAULT '' NOT NULL,
	"kind" "finance"."account_kind" NOT NULL,
	"opening_balance_cents" integer,
	"limit_cents" integer,
	"closing_day" smallint,
	"due_day" smallint,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_name_not_blank" CHECK (btrim("finance"."accounts"."name") <> ''),
	CONSTRAINT "accounts_fields_by_kind" CHECK (case when "finance"."accounts"."kind" = 'credito'
        then "finance"."accounts"."opening_balance_cents" is null
          and "finance"."accounts"."closing_day" is not null and "finance"."accounts"."closing_day" between 1 and 31
          and "finance"."accounts"."due_day" is not null and "finance"."accounts"."due_day" between 1 and 31
          and ("finance"."accounts"."limit_cents" is null or "finance"."accounts"."limit_cents" >= 0)
        else "finance"."accounts"."opening_balance_cents" is not null
          and num_nonnulls("finance"."accounts"."limit_cents", "finance"."accounts"."closing_day", "finance"."accounts"."due_day") = 0
        end)
);
--> statement-breakpoint
CREATE TABLE "finance"."cash_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"direction" "finance"."cash_direction" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_entries_description_not_blank" CHECK (btrim("finance"."cash_entries"."description") <> ''),
	CONSTRAINT "cash_entries_amount_positive" CHECK ("finance"."cash_entries"."amount_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."cash_entry_tags" (
	"cash_entry_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "cash_entry_tags_cash_entry_id_tag_id_pk" PRIMARY KEY("cash_entry_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "finance"."categories" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"kind" "finance"."category_kind" NOT NULL,
	"color" text NOT NULL,
	"system_key" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_system_key_unique" UNIQUE("system_key"),
	CONSTRAINT "categories_name_not_blank" CHECK (btrim("finance"."categories"."name") <> '')
);
--> statement-breakpoint
CREATE TABLE "finance"."credit_purchase_tags" (
	"credit_purchase_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "credit_purchase_tags_credit_purchase_id_tag_id_pk" PRIMARY KEY("credit_purchase_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "finance"."credit_purchases" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"description" text NOT NULL,
	"kind" "finance"."purchase_kind" DEFAULT 'compra' NOT NULL,
	"credit_account_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_cents" integer NOT NULL,
	"installments" smallint NOT NULL,
	"first_installment" smallint DEFAULT 1 NOT NULL,
	"first_invoice_month" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_purchases_description_not_blank" CHECK (btrim("finance"."credit_purchases"."description") <> ''),
	CONSTRAINT "credit_purchases_total_positive" CHECK ("finance"."credit_purchases"."total_cents" > 0),
	CONSTRAINT "credit_purchases_installments_valid" CHECK ("finance"."credit_purchases"."first_installment" >= 1 and "finance"."credit_purchases"."first_installment" <= "finance"."credit_purchases"."installments"),
	CONSTRAINT "credit_purchases_invoice_month" CHECK (extract(day from "finance"."credit_purchases"."first_invoice_month") = 1)
);
--> statement-breakpoint
CREATE TABLE "finance"."invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"credit_account_id" uuid NOT NULL,
	"invoice_month" date NOT NULL,
	"paid_at" date NOT NULL,
	"paid_from_account_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_payments_account_month_key" UNIQUE("credit_account_id","invoice_month"),
	CONSTRAINT "invoice_payments_amount_positive" CHECK ("finance"."invoice_payments"."amount_cents" > 0),
	CONSTRAINT "invoice_payments_month" CHECK (extract(day from "finance"."invoice_payments"."invoice_month") = 1),
	CONSTRAINT "invoice_payments_distinct_accounts" CHECK ("finance"."invoice_payments"."credit_account_id" <> "finance"."invoice_payments"."paid_from_account_id")
);
--> statement-breakpoint
CREATE TABLE "finance"."loans" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"description" text NOT NULL,
	"credit_account_id" uuid NOT NULL,
	"deposit_account_id" uuid,
	"received_at" date NOT NULL,
	"principal_cents" integer NOT NULL,
	"installment_amount_cents" integer NOT NULL,
	"installments" smallint NOT NULL,
	"first_installment" smallint DEFAULT 1 NOT NULL,
	"first_invoice_month" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loans_description_not_blank" CHECK (btrim("finance"."loans"."description") <> ''),
	CONSTRAINT "loans_principal_positive" CHECK ("finance"."loans"."principal_cents" > 0),
	CONSTRAINT "loans_installment_amount_positive" CHECK ("finance"."loans"."installment_amount_cents" > 0),
	CONSTRAINT "loans_installments_valid" CHECK ("finance"."loans"."first_installment" >= 1 and "finance"."loans"."first_installment" <= "finance"."loans"."installments"),
	CONSTRAINT "loans_invoice_month" CHECK (extract(day from "finance"."loans"."first_invoice_month") = 1)
);
--> statement-breakpoint
CREATE TABLE "finance"."payable_tags" (
	"payable_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "payable_tags_payable_id_tag_id_pk" PRIMARY KEY("payable_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "finance"."payables" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"due_date" date NOT NULL,
	"supplier" text,
	"settled_at" date,
	"settled_account_id" uuid,
	"settled_amount_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payables_description_not_blank" CHECK (btrim("finance"."payables"."description") <> ''),
	CONSTRAINT "payables_amount_positive" CHECK ("finance"."payables"."amount_cents" > 0),
	CONSTRAINT "payables_settlement_complete" CHECK (num_nonnulls("finance"."payables"."settled_at", "finance"."payables"."settled_account_id", "finance"."payables"."settled_amount_cents") in (0, 3)),
	CONSTRAINT "payables_settled_amount_positive" CHECK ("finance"."payables"."settled_amount_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."receivable_tags" (
	"receivable_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "receivable_tags_receivable_id_tag_id_pk" PRIMARY KEY("receivable_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "finance"."receivables" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"due_date" date NOT NULL,
	"customer" text,
	"settled_at" date,
	"settled_account_id" uuid,
	"settled_amount_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receivables_description_not_blank" CHECK (btrim("finance"."receivables"."description") <> ''),
	CONSTRAINT "receivables_amount_positive" CHECK ("finance"."receivables"."amount_cents" > 0),
	CONSTRAINT "receivables_settlement_complete" CHECK (num_nonnulls("finance"."receivables"."settled_at", "finance"."receivables"."settled_account_id", "finance"."receivables"."settled_amount_cents") in (0, 3)),
	CONSTRAINT "receivables_settled_amount_positive" CHECK ("finance"."receivables"."settled_amount_cents" > 0)
);
--> statement-breakpoint
CREATE TABLE "finance"."tags" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"description" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_not_blank" CHECK (btrim("finance"."tags"."name") <> '')
);
--> statement-breakpoint
CREATE TABLE "finance"."transfers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"date" date NOT NULL,
	"from_account_id" uuid NOT NULL,
	"to_account_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfers_amount_positive" CHECK ("finance"."transfers"."amount_cents" > 0),
	CONSTRAINT "transfers_distinct_accounts" CHECK ("finance"."transfers"."from_account_id" <> "finance"."transfers"."to_account_id")
);
--> statement-breakpoint
ALTER TABLE "finance"."cash_entries" ADD CONSTRAINT "cash_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "finance"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."cash_entries" ADD CONSTRAINT "cash_entries_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."cash_entry_tags" ADD CONSTRAINT "cash_entry_tags_cash_entry_id_cash_entries_id_fk" FOREIGN KEY ("cash_entry_id") REFERENCES "finance"."cash_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."cash_entry_tags" ADD CONSTRAINT "cash_entry_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "finance"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."credit_purchase_tags" ADD CONSTRAINT "credit_purchase_tags_credit_purchase_id_credit_purchases_id_fk" FOREIGN KEY ("credit_purchase_id") REFERENCES "finance"."credit_purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."credit_purchase_tags" ADD CONSTRAINT "credit_purchase_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "finance"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."credit_purchases" ADD CONSTRAINT "credit_purchases_credit_account_id_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."credit_purchases" ADD CONSTRAINT "credit_purchases_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "finance"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoice_payments" ADD CONSTRAINT "invoice_payments_credit_account_id_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."invoice_payments" ADD CONSTRAINT "invoice_payments_paid_from_account_id_accounts_id_fk" FOREIGN KEY ("paid_from_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."loans" ADD CONSTRAINT "loans_credit_account_id_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."loans" ADD CONSTRAINT "loans_deposit_account_id_accounts_id_fk" FOREIGN KEY ("deposit_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."payable_tags" ADD CONSTRAINT "payable_tags_payable_id_payables_id_fk" FOREIGN KEY ("payable_id") REFERENCES "finance"."payables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."payable_tags" ADD CONSTRAINT "payable_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "finance"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."payables" ADD CONSTRAINT "payables_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "finance"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."payables" ADD CONSTRAINT "payables_settled_account_id_accounts_id_fk" FOREIGN KEY ("settled_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."receivable_tags" ADD CONSTRAINT "receivable_tags_receivable_id_receivables_id_fk" FOREIGN KEY ("receivable_id") REFERENCES "finance"."receivables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."receivable_tags" ADD CONSTRAINT "receivable_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "finance"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."receivables" ADD CONSTRAINT "receivables_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "finance"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."receivables" ADD CONSTRAINT "receivables_settled_account_id_accounts_id_fk" FOREIGN KEY ("settled_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."transfers" ADD CONSTRAINT "transfers_from_account_id_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance"."transfers" ADD CONSTRAINT "transfers_to_account_id_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "finance"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cash_entries_date_idx" ON "finance"."cash_entries" USING btree ("date");--> statement-breakpoint
CREATE INDEX "cash_entries_category_idx" ON "finance"."cash_entries" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "cash_entries_account_idx" ON "finance"."cash_entries" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "cash_entry_tags_tag_idx" ON "finance"."cash_entry_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_kind_name_key" ON "finance"."categories" USING btree ("kind",lower("name"));--> statement-breakpoint
CREATE INDEX "credit_purchase_tags_tag_idx" ON "finance"."credit_purchase_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "credit_purchases_date_idx" ON "finance"."credit_purchases" USING btree ("date");--> statement-breakpoint
CREATE INDEX "credit_purchases_category_idx" ON "finance"."credit_purchases" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "credit_purchases_account_idx" ON "finance"."credit_purchases" USING btree ("credit_account_id");--> statement-breakpoint
CREATE INDEX "invoice_payments_paid_at_idx" ON "finance"."invoice_payments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "invoice_payments_paid_from_idx" ON "finance"."invoice_payments" USING btree ("paid_from_account_id");--> statement-breakpoint
CREATE INDEX "loans_received_at_idx" ON "finance"."loans" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "loans_credit_account_idx" ON "finance"."loans" USING btree ("credit_account_id");--> statement-breakpoint
CREATE INDEX "loans_deposit_account_idx" ON "finance"."loans" USING btree ("deposit_account_id");--> statement-breakpoint
CREATE INDEX "payable_tags_tag_idx" ON "finance"."payable_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "payables_due_date_idx" ON "finance"."payables" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "payables_settled_at_idx" ON "finance"."payables" USING btree ("settled_at");--> statement-breakpoint
CREATE INDEX "payables_category_idx" ON "finance"."payables" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "payables_settled_account_idx" ON "finance"."payables" USING btree ("settled_account_id");--> statement-breakpoint
CREATE INDEX "receivable_tags_tag_idx" ON "finance"."receivable_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "receivables_due_date_idx" ON "finance"."receivables" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "receivables_settled_at_idx" ON "finance"."receivables" USING btree ("settled_at");--> statement-breakpoint
CREATE INDEX "receivables_category_idx" ON "finance"."receivables" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "receivables_settled_account_idx" ON "finance"."receivables" USING btree ("settled_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_key" ON "finance"."tags" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "transfers_date_idx" ON "finance"."transfers" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transfers_from_account_idx" ON "finance"."transfers" USING btree ("from_account_id");--> statement-breakpoint
CREATE INDEX "transfers_to_account_idx" ON "finance"."transfers" USING btree ("to_account_id");