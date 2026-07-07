import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Instant-quote pricing overhaul:
 *  1. New `quote_pricing` global table (editable size-only price model + survey
 *     fee + size caps). A global maps to a single flat table, one row, no FKs —
 *     mirrors the `site_settings` shape from the initial migration.
 *  2. Three new columns on `quote_requests` for the persisted survey fee, so
 *     each instant lead records whether a call-out fee applied and the distance.
 *
 * Column names follow Payload's postgres snake_case (e.g. `areaM2` →
 * `area_m2`, matching the existing `estimator_area_m2`).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "quote_pricing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"price_floor" numeric,
  	"floor_area_m2" numeric,
  	"start_rate_per_m2" numeric,
  	"flat_rate_per_m2" numeric,
  	"survey_fee" numeric,
  	"survey_distance_miles" numeric,
  	"base_postcode" varchar,
  	"min_width_m" numeric,
  	"max_width_m" numeric,
  	"min_depth_m" numeric,
  	"max_depth_m" numeric,
  	"step_m" numeric,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "estimator_survey_required" boolean;
  ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "estimator_survey_fee" numeric;
  ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "estimator_distance_miles" numeric;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "quote_requests" DROP COLUMN IF EXISTS "estimator_distance_miles";
  ALTER TABLE "quote_requests" DROP COLUMN IF EXISTS "estimator_survey_fee";
  ALTER TABLE "quote_requests" DROP COLUMN IF EXISTS "estimator_survey_required";
  DROP TABLE IF EXISTS "quote_pricing" CASCADE;`)
}
