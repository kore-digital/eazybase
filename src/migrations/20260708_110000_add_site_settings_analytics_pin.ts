import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `site_settings.analytics_pin` (varchar) — the PIN that unlocks the
 * EazyBase Analytics phone app (/analytics). Admin-only at the field level.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "analytics_pin" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "analytics_pin";`)
}
