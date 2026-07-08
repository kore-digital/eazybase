import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Extends the editable eyebrow/lede framing text to the remaining section blocks
 * (rich text, image+text, process timeline, stats, CTA band, FAQ list, award
 * badge) so about-us / what-we-do / areas / gallery framing can be tagged.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rich_text" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_rich_text" ADD COLUMN IF NOT EXISTS "lede" varchar;
  ALTER TABLE "pages_blocks_image_text" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_process_timeline" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_process_timeline" ADD COLUMN IF NOT EXISTS "lede" varchar;
  ALTER TABLE "pages_blocks_stats_counters" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_stats_counters" ADD COLUMN IF NOT EXISTS "lede" varchar;
  ALTER TABLE "pages_blocks_cta_band" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_faq_list" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;
  ALTER TABLE "pages_blocks_faq_list" ADD COLUMN IF NOT EXISTS "lede" varchar;
  ALTER TABLE "pages_blocks_award_badge" ADD COLUMN IF NOT EXISTS "eyebrow" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_rich_text" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_rich_text" DROP COLUMN IF EXISTS "lede";
  ALTER TABLE "pages_blocks_image_text" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_process_timeline" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_process_timeline" DROP COLUMN IF EXISTS "lede";
  ALTER TABLE "pages_blocks_stats_counters" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_stats_counters" DROP COLUMN IF EXISTS "lede";
  ALTER TABLE "pages_blocks_cta_band" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_faq_list" DROP COLUMN IF EXISTS "eyebrow";
  ALTER TABLE "pages_blocks_faq_list" DROP COLUMN IF EXISTS "lede";
  ALTER TABLE "pages_blocks_award_badge" DROP COLUMN IF EXISTS "eyebrow";`)
}
