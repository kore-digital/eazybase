import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the optional `cardImage` upload field to the pages collection
 * (dashboard page-card thumbnail). Matches Payload's postgres naming for an
 * upload relation: a `<field>_id` integer column + FK to media + index,
 * mirroring the existing gallery_items.image_id shape.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages" ADD COLUMN "card_image_id" integer;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_card_image_id_media_id_fk" FOREIGN KEY ("card_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_card_image_idx" ON "pages" USING btree ("card_image_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX "pages_card_image_idx";
  ALTER TABLE "pages" DROP CONSTRAINT "pages_card_image_id_media_id_fk";
  ALTER TABLE "pages" DROP COLUMN "card_image_id";`)
}
