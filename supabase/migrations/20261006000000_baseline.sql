

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."currency_type" AS ENUM (
    'USD',
    'EUR',
    'GBP',
    'UAH',
    'PLN'
);


ALTER TYPE "public"."currency_type" OWNER TO "postgres";


CREATE TYPE "public"."transaction_category" AS ENUM (
    'Restaurants & Cafés',
    'Clothing',
    'Transportation',
    'Bills & Utilities',
    'Entertainment',
    'Healthcare',
    'Education',
    'Travel',
    'Presents',
    'Other',
    'Donations',
    'Subscriptions',
    'Groceries',
    'Car',
    'Home',
    'Taxes',
    'Electronics',
    'Children',
    'Parents',
    'Pets',
    'Sport',
    'Style and Beauty',
    'Extra',
    'Salary'
);


ALTER TYPE "public"."transaction_category" OWNER TO "postgres";


CREATE TYPE "public"."transaction_label" AS ENUM (
    'Personal',
    'Business',
    'Family',
    'Important',
    'Recurring'
);


ALTER TYPE "public"."transaction_label" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'expense',
    'income',
    'transfer'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."wallet_type" AS ENUM (
    'credit',
    'debit',
    'cash',
    'bank',
    'crypto',
    'savings',
    'investment',
    'ewallet'
);


ALTER TYPE "public"."wallet_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_data"("user_id_input" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Delete user's transactions if any exist
  if exists (select 1 from transactions where user_id = user_id_input) then
    delete from transactions where user_id = user_id_input;
  end if;
  
  -- Delete user's bank integrations if any exist
  if exists (select 1 from bank_integrations where user_id = user_id_input) then
    delete from bank_integrations where user_id = user_id_input;
  end if;
  
  -- Delete user's category customizations if any exist
  if exists (select 1 from user_categories where user_id = user_id_input) then
    delete from user_categories where user_id = user_id_input;
  end if;
  
  -- Delete user's wallets if any exist
  if exists (select 1 from wallets where user_id = user_id_input) then
    delete from wallets where user_id = user_id_input;
  end if;
end;
$$;


ALTER FUNCTION "public"."delete_user_data"("user_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."exec_sql"("sql" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  execute sql;
end;
$$;


ALTER FUNCTION "public"."exec_sql"("sql" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_months"("p_wallet_id" "uuid", "p_lookback_years" integer DEFAULT 2) RETURNS TABLE("month_date" "date")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Get the authenticated user's ID from Supabase auth context
  -- This ensures users can only see their own data
  RETURN QUERY
  SELECT DISTINCT
    date_trunc('month', date)::date as month_date
  FROM transactions
  WHERE
    user_id = auth.uid()                    -- Security: Only user's own transactions
    AND wallet_id = p_wallet_id              -- Filter by wallet
    AND type = 'expense'                     -- Only expenses (not income)
    AND is_deleted = false                   -- Exclude soft-deleted
    AND is_hidden = false                    -- Exclude hidden
    AND date >= CURRENT_DATE - (p_lookback_years || ' years')::interval  -- Date range
  ORDER BY month_date DESC                   -- Most recent first
  LIMIT 24;                                  -- Safety limit: max 24 months
END;
$$;


ALTER FUNCTION "public"."get_available_months"("p_wallet_id" "uuid", "p_lookback_years" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_primary_wallet"("wallet_id_input" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- First, set all wallets to not primary
  update wallets
  set is_primary = false
  where user_id = auth.uid();
  
  -- Then set the selected wallet as primary
  update wallets
  set is_primary = true
  where id = wallet_id_input and user_id = auth.uid();
end;
$$;


ALTER FUNCTION "public"."set_primary_wallet"("wallet_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_wallet_balance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if TG_OP = 'INSERT' then
    -- Update wallet balance based on transaction type
    update wallets
    set balance = case
      when NEW.type = 'income' then balance + NEW.amount
      when NEW.type = 'expense' then balance - NEW.amount
    end
    where id = NEW.wallet_id;
    return NEW;
  elsif TG_OP = 'UPDATE' then
    -- Revert old transaction
    update wallets
    set balance = case
      when OLD.type = 'income' then balance - OLD.amount
      when OLD.type = 'expense' then balance + OLD.amount
    end
    where id = OLD.wallet_id;
    
    -- Apply new transaction
    update wallets
    set balance = case
      when NEW.type = 'income' then balance + NEW.amount
      when NEW.type = 'expense' then balance - NEW.amount
    end
    where id = NEW.wallet_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    -- Revert the transaction when deleted
    update wallets
    set balance = case
      when OLD.type = 'income' then balance - OLD.amount
      when OLD.type = 'expense' then balance + OLD.amount
    end
    where id = OLD.wallet_id;
    return OLD;
  end if;
  return null;
end;
$$;


ALTER FUNCTION "public"."update_wallet_balance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_wealth_snapshot"("p_snapshot_id" "uuid", "p_snapshot" "jsonb", "p_lines" "jsonb", "p_allocations" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  update wealth_snapshots
     set snapshot_date    = (p_snapshot ->> 'snapshot_date')::date,
         display_currency = p_snapshot ->> 'display_currency',
         note             = p_snapshot ->> 'note'
   where id = p_snapshot_id
     and user_id = auth.uid()
     and is_deleted = false;

  if not found then
    raise exception 'Snapshot not found' using errcode = 'P0002';
  end if;

  delete from snapshot_lines where snapshot_id = p_snapshot_id;

  insert into snapshot_lines (
    user_id, snapshot_id, label, type, currency, amount, rate, rate_source,
    converted_amount, is_liquid, sort_order
  )
  select auth.uid(), p_snapshot_id, x.label, x.type, x.currency, x.amount,
         x.rate, x.rate_source, x.converted_amount, x.is_liquid, x.sort_order
    from jsonb_to_recordset(p_lines) as x (
      label text, type text, currency text, amount numeric, rate numeric,
      rate_source text, converted_amount numeric, is_liquid boolean,
      sort_order integer
    );

  delete from snapshot_allocations where snapshot_id = p_snapshot_id;

  insert into snapshot_allocations (user_id, snapshot_id, claim_id, amount)
  select auth.uid(), p_snapshot_id, x.claim_id, x.amount
    from jsonb_to_recordset(p_allocations) as x (claim_id uuid, amount numeric);
end;
$$;


ALTER FUNCTION "public"."update_wealth_snapshot"("p_snapshot_id" "uuid", "p_snapshot" "jsonb", "p_lines" "jsonb", "p_allocations" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bank_integrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "api_token" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_sync_at" timestamp with time zone,
    "wallet_id" "uuid",
    CONSTRAINT "bank_integrations_provider_check" CHECK (("provider" = 'monobank'::"text"))
);


ALTER TABLE "public"."bank_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text",
    "color_bg" "text",
    "color_text" "text",
    "is_system" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "key" character varying(255)
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "target_amount" numeric,
    "is_archived" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_currency" "text",
    "target_date" "date"
);


ALTER TABLE "public"."claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fx_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rate_date" "date" NOT NULL,
    "base" "text" NOT NULL,
    "quote" "text" NOT NULL,
    "rate" numeric NOT NULL,
    "source" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fx_rates_rate_check" CHECK (("rate" > (0)::numeric))
);


ALTER TABLE "public"."fx_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snapshot_allocations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_id" "uuid" NOT NULL,
    "claim_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "snapshot_allocations_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."snapshot_allocations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snapshot_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "type" "text" NOT NULL,
    "currency" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "rate" numeric NOT NULL,
    "converted_amount" numeric NOT NULL,
    "is_liquid" boolean DEFAULT false NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rate_source" "text"
);


ALTER TABLE "public"."snapshot_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "blocks" "jsonb" NOT NULL,
    "layout" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "description" "text",
    "label" "public"."transaction_label" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "monobank_id" "text",
    "is_deleted" boolean DEFAULT false,
    "category_id" "uuid",
    "is_hidden" boolean DEFAULT false NOT NULL,
    "source" character varying(20) DEFAULT 'manual'::character varying
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "custom_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."wallet_type" NOT NULL,
    "balance" numeric(15,2) DEFAULT 0,
    "currency" "public"."currency_type" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_primary" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wealth_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "display_currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "note" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."wealth_snapshots" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bank_integrations"
    ADD CONSTRAINT "bank_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bank_integrations"
    ADD CONSTRAINT "bank_integrations_user_id_provider_is_active_key" UNIQUE ("user_id", "provider", "is_active");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fx_rates"
    ADD CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fx_rates"
    ADD CONSTRAINT "fx_rates_rate_date_base_quote_source_key" UNIQUE ("rate_date", "base", "quote", "source");



ALTER TABLE ONLY "public"."snapshot_allocations"
    ADD CONSTRAINT "snapshot_allocations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."snapshot_allocations"
    ADD CONSTRAINT "snapshot_allocations_snapshot_id_claim_id_key" UNIQUE ("snapshot_id", "claim_id");



ALTER TABLE ONLY "public"."snapshot_lines"
    ADD CONSTRAINT "snapshot_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_monobank_unique" UNIQUE ("user_id", "monobank_id");



ALTER TABLE ONLY "public"."user_categories"
    ADD CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_categories"
    ADD CONSTRAINT "user_categories_user_id_category_id_key" UNIQUE ("user_id", "category_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wealth_snapshots"
    ADD CONSTRAINT "wealth_snapshots_pkey" PRIMARY KEY ("id");



CREATE INDEX "bank_integrations_provider_idx" ON "public"."bank_integrations" USING "btree" ("provider");



CREATE INDEX "bank_integrations_user_id_idx" ON "public"."bank_integrations" USING "btree" ("user_id");



CREATE INDEX "fx_rates_lookup_idx" ON "public"."fx_rates" USING "btree" ("source", "base", "quote", "rate_date" DESC);



CREATE INDEX "idx_monobank_id" ON "public"."transactions" USING "btree" ("monobank_id");



CREATE UNIQUE INDEX "idx_user_primary_wallet" ON "public"."wallets" USING "btree" ("user_id") WHERE ("is_primary" = true);



CREATE INDEX "idx_wallets_is_deleted" ON "public"."wallets" USING "btree" ("is_deleted");



CREATE INDEX "snapshot_allocations_claim_id_idx" ON "public"."snapshot_allocations" USING "btree" ("claim_id");



CREATE INDEX "snapshot_lines_snapshot_id_idx" ON "public"."snapshot_lines" USING "btree" ("snapshot_id");



CREATE UNIQUE INDEX "wealth_snapshots_user_date_uniq" ON "public"."wealth_snapshots" USING "btree" ("user_id", "snapshot_date") WHERE ("is_deleted" = false);



CREATE OR REPLACE TRIGGER "claims_set_updated_at" BEFORE UPDATE ON "public"."claims" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."bank_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_transactions_updated_at" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_wallet_balance_on_transaction" AFTER INSERT OR DELETE OR UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_wallet_balance"();



CREATE OR REPLACE TRIGGER "update_wallets_updated_at" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "wealth_snapshots_set_updated_at" BEFORE UPDATE ON "public"."wealth_snapshots" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."bank_integrations"
    ADD CONSTRAINT "bank_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."bank_integrations"
    ADD CONSTRAINT "bank_integrations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."claims"
    ADD CONSTRAINT "claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_allocations"
    ADD CONSTRAINT "snapshot_allocations_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id");



ALTER TABLE ONLY "public"."snapshot_allocations"
    ADD CONSTRAINT "snapshot_allocations_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "public"."wealth_snapshots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_allocations"
    ADD CONSTRAINT "snapshot_allocations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_lines"
    ADD CONSTRAINT "snapshot_lines_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "public"."wealth_snapshots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snapshot_lines"
    ADD CONSTRAINT "snapshot_lines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id");



ALTER TABLE ONLY "public"."user_categories"
    ADD CONSTRAINT "user_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_categories"
    ADD CONSTRAINT "user_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."wealth_snapshots"
    ADD CONSTRAINT "wealth_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Public read for system categories" ON "public"."categories" FOR SELECT USING (("is_system" = true));



CREATE POLICY "User can delete own user_categories" ON "public"."user_categories" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "User can insert own user_categories" ON "public"."user_categories" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "User can select own user_categories" ON "public"."user_categories" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "User can update own user_categories" ON "public"."user_categories" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own integrations" ON "public"."bank_integrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own templates" ON "public"."templates" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own transactions" ON "public"."transactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own wallets" ON "public"."wallets" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own bank integrations" ON "public"."bank_integrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own templates" ON "public"."templates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own wallets" ON "public"."wallets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only access their own wallets" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only insert their own transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bank integrations" ON "public"."bank_integrations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own templates" ON "public"."templates" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own transactions" ON "public"."transactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own wallets" ON "public"."wallets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own bank integrations" ON "public"."bank_integrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own templates" ON "public"."templates" FOR SELECT USING ((("auth"."uid"() = "user_id") AND ("is_deleted" = false)));



CREATE POLICY "Users can view their own transactions" ON "public"."transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own wallets" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "authenticated read fx_rates" ON "public"."fx_rates" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."bank_integrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fx_rates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "own allocations" ON "public"."snapshot_allocations" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."wealth_snapshots" "s"
  WHERE (("s"."id" = "snapshot_allocations"."snapshot_id") AND ("s"."user_id" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."claims" "c"
  WHERE (("c"."id" = "snapshot_allocations"."claim_id") AND ("c"."user_id" = "auth"."uid"()))))));



CREATE POLICY "own claims" ON "public"."claims" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "own lines" ON "public"."snapshot_lines" USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."wealth_snapshots" "s"
  WHERE (("s"."id" = "snapshot_lines"."snapshot_id") AND ("s"."user_id" = "auth"."uid"()))))));



CREATE POLICY "own snapshots" ON "public"."wealth_snapshots" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."snapshot_allocations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."snapshot_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wealth_snapshots" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

















































































































































































GRANT ALL ON FUNCTION "public"."delete_user_data"("user_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_data"("user_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_data"("user_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."exec_sql"("sql" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_months"("p_wallet_id" "uuid", "p_lookback_years" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_months"("p_wallet_id" "uuid", "p_lookback_years" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_months"("p_wallet_id" "uuid", "p_lookback_years" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_primary_wallet"("wallet_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_primary_wallet"("wallet_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_primary_wallet"("wallet_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_wallet_balance"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_wallet_balance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_wallet_balance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_wealth_snapshot"("p_snapshot_id" "uuid", "p_snapshot" "jsonb", "p_lines" "jsonb", "p_allocations" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_wealth_snapshot"("p_snapshot_id" "uuid", "p_snapshot" "jsonb", "p_lines" "jsonb", "p_allocations" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_wealth_snapshot"("p_snapshot_id" "uuid", "p_snapshot" "jsonb", "p_lines" "jsonb", "p_allocations" "jsonb") TO "service_role";



























GRANT ALL ON TABLE "public"."bank_integrations" TO "anon";
GRANT ALL ON TABLE "public"."bank_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."bank_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."claims" TO "anon";
GRANT ALL ON TABLE "public"."claims" TO "authenticated";
GRANT ALL ON TABLE "public"."claims" TO "service_role";



GRANT ALL ON TABLE "public"."fx_rates" TO "anon";
GRANT ALL ON TABLE "public"."fx_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."fx_rates" TO "service_role";



GRANT ALL ON TABLE "public"."snapshot_allocations" TO "anon";
GRANT ALL ON TABLE "public"."snapshot_allocations" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshot_allocations" TO "service_role";



GRANT ALL ON TABLE "public"."snapshot_lines" TO "anon";
GRANT ALL ON TABLE "public"."snapshot_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."snapshot_lines" TO "service_role";



GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_categories" TO "anon";
GRANT ALL ON TABLE "public"."user_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."user_categories" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



GRANT ALL ON TABLE "public"."wealth_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."wealth_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."wealth_snapshots" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























