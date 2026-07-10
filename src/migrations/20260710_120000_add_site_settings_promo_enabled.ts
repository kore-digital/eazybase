import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `site_settings.promo_enabled` (boolean) — the admin on/off toggle for
 * the free-SkyPod launch offer (pop-up + instant-quote banner). Defaults to
 * true so the offer stays on for the existing row until turned off.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "promo_enabled" boolean DEFAULT true;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "promo_enabled";`)
}
