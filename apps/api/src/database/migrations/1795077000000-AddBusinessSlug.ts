import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessSlug1795077000000 implements MigrationInterface {
  name = 'AddBusinessSlug1795077000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "slug" character varying(100)`);

    await queryRunner.query(`
      UPDATE "businesses"
      SET "slug" = CASE
        WHEN "name" = 'Matka Chiya & Khaja Ghar' THEN 'matka-chiya'
        WHEN "name" = 'Himalayan Brew Demo' THEN 'himalayan-brew-demo'
        ELSE regexp_replace(lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')), '^-|-$', '', 'g')
      END
      WHERE "slug" IS NULL
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_businesses_slug" ON "businesses" ("slug") WHERE "slug" IS NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_businesses_slug"`);
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN IF EXISTS "slug"`);
  }
}
