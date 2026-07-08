import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `sectionCopy` group to pages — editable eyebrow/heading/lede for the
 * fixed (non-block) page sections (gallery before/after + photos, about-us
 * why/example, what-we-do process). Flat columns, all nullable.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_before_after_eyebrow" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_before_after_heading" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_before_after_lede" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_photos_eyebrow" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_photos_heading" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_photos_lede" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_why_eyebrow" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_why_heading" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_why_lede" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_example_eyebrow" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_example_heading" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_example_lede" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_process_eyebrow" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_process_heading" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "section_copy_process_lede" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_before_after_eyebrow";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_before_after_heading";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_before_after_lede";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_photos_eyebrow";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_photos_heading";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_photos_lede";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_why_eyebrow";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_why_heading";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_why_lede";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_example_eyebrow";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_example_heading";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_example_lede";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_process_eyebrow";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_process_heading";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "section_copy_process_lede";`)
}
