import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds editable `eyebrow` + `lede` framing text to the home-page section blocks
 * (use-case tabs, testimonial strip, gallery strip). Simple column adds on the
 * existing block tables.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_use_case_tabs" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_use_case_tabs" ADD COLUMN IF NOT EXISTS "lede" varchar;
  ALTER TABLE "pages_blocks_testimonial_strip" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_testimonial_strip" ADD COLUMN IF NOT EXISTS "lede" varchar;
  ALTER TABLE "pages_blocks_gallery_strip" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_gallery_strip" ADD COLUMN IF NOT EXISTS "lede" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_use_case_tabs" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_use_case_tabs" DROP COLUMN IF EXISTS "lede";
  ALTER TABLE "pages_blocks_testimonial_strip" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_testimonial_strip" DROP COLUMN IF EXISTS "lede";
  ALTER TABLE "pages_blocks_gallery_strip" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_gallery_strip" DROP COLUMN IF EXISTS "lede";`)
}
