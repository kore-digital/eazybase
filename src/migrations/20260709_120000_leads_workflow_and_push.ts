import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Lead-management workspace for the analytics PWA:
 *  1. Expand the `enum_quote_requests_status` pipeline with the full set of
 *     working statuses (Postgres enums are append-only — new values are added,
 *     legacy `contacted`/`closed` stay). Adding values inside the migration
 *     transaction is fine on PG12+ so long as they aren't *used* in the same
 *     transaction (they aren't).
 *  2. Three workflow columns on `quote_requests` (snake_cased by Payload):
 *     `last_contacted_at`, `next_follow_up_at`, `internal_notes`.
 *  3. New `push_subscriptions` collection table (one row per opted-in device)
 *     + its wiring into `payload_locked_documents_rels`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "enum_quote_requests_status" ADD VALUE IF NOT EXISTS 'emailed_no_answer';
  ALTER TYPE "enum_quote_requests_status" ADD VALUE IF NOT EXISTS 'called_no_answer';
  ALTER TYPE "enum_quote_requests_status" ADD VALUE IF NOT EXISTS 'spoke';
  ALTER TYPE "enum_quote_requests_status" ADD VALUE IF NOT EXISTS 'quote_sent';
  ALTER TYPE "enum_quote_requests_status" ADD VALUE IF NOT EXISTS 'won';
  ALTER TYPE "enum_quote_requests_status" ADD VALUE IF NOT EXISTS 'lost';

  ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "last_contacted_at" timestamp(3) with time zone;
  ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "next_follow_up_at" timestamp(3) with time zone;
  ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "internal_notes" varchar;

  CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"endpoint" varchar NOT NULL,
  	"p256dh" varchar NOT NULL,
  	"auth" varchar NOT NULL,
  	"label" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");
  CREATE INDEX IF NOT EXISTS "push_subscriptions_updated_at_idx" ON "push_subscriptions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "push_subscriptions_created_at_idx" ON "push_subscriptions" USING btree ("created_at");

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "push_subscriptions_id" integer;`)

  // ADD CONSTRAINT has no IF NOT EXISTS in Postgres — guard it so re-runs are safe.
  await db.execute(sql`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_push_subscriptions_fk'
    ) THEN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_push_subscriptions_fk"
        FOREIGN KEY ("push_subscriptions_id") REFERENCES "public"."push_subscriptions"("id")
        ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;

  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_push_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("push_subscriptions_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Enum values are intentionally left in place (Postgres cannot easily drop
  // enum values, and leaving them is harmless).
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_push_subscriptions_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_push_subscriptions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "push_subscriptions_id";
  DROP TABLE IF EXISTS "push_subscriptions" CASCADE;
  ALTER TABLE "quote_requests" DROP COLUMN IF EXISTS "internal_notes";
  ALTER TABLE "quote_requests" DROP COLUMN IF EXISTS "next_follow_up_at";
  ALTER TABLE "quote_requests" DROP COLUMN IF EXISTS "last_contacted_at";`)
}
