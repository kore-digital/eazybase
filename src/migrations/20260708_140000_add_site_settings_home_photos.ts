import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `homePhotos` group to the site_settings global — the two full-width
 * home-page photo bands (image + eyebrow/heading/sub each). Flat columns on the
 * single-row global; the two image relations mirror the gallery_items.image_id
 * upload FK pattern.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_photos_band1_image_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_photos_band1_eyebrow" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_photos_band1_heading" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_photos_band1_sub" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_photos_band2_image_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_photos_band2_eyebrow" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_photos_band2_heading" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "home_photos_band2_sub" varchar;

  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_home_photos_band1_image_id_media_id_fk" FOREIGN KEY ("home_photos_band1_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_home_photos_band2_image_id_media_id_fk" FOREIGN KEY ("home_photos_band2_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "site_settings_home_photos_band1_image_idx" ON "site_settings" USING btree ("home_photos_band1_image_id");
  CREATE INDEX IF NOT EXISTS "site_settings_home_photos_band2_image_idx" ON "site_settings" USING btree ("home_photos_band2_image_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "site_settings_home_photos_band1_image_idx";
  DROP INDEX IF EXISTS "site_settings_home_photos_band2_image_idx";
  ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_home_photos_band1_image_id_media_id_fk";
  ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_home_photos_band2_image_id_media_id_fk";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "home_photos_band1_image_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "home_photos_band1_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "home_photos_band1_heading";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "home_photos_band1_sub";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "home_photos_band2_image_id";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "home_photos_band2_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "home_photos_band2_heading";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "home_photos_band2_sub";`)
}
