import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTdTpGroups1589765625417 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Check if the columns already exist
    const hasColumns = await queryRunner.hasColumn("etudiant", "td_groupe_id");
    if (hasColumns) {
      return; // Skip if columns are already added
    }

    // 2. Add columns for TD and TP groups to the etudiant table
    await queryRunner.query(`
      ALTER TABLE "etudiant"
      ADD COLUMN "td_groupe_id" uuid NULL,
      ADD COLUMN "tp_groupe_id" uuid NULL
    `);

    // 3. Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "etudiant"
      ADD CONSTRAINT "FK_etudiant_td_groupe"
      FOREIGN KEY ("td_groupe_id")
      REFERENCES "groupe"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "etudiant"
      ADD CONSTRAINT "FK_etudiant_tp_groupe"
      FOREIGN KEY ("tp_groupe_id")
      REFERENCES "groupe"("id")
      ON DELETE SET NULL
    `);

    // 4. Copy existing group assignments based on group type
    await queryRunner.query(`
      UPDATE "etudiant" e
      SET "td_groupe_id" = e.groupe_id
      FROM "groupe" g
      WHERE e.groupe_id = g.id AND g.type = 'td'
    `);

    await queryRunner.query(`
      UPDATE "etudiant" e
      SET "tp_groupe_id" = e.groupe_id
      FROM "groupe" g
      WHERE e.groupe_id = g.id AND g.type = 'tp'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Remove the foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "etudiant"
      DROP CONSTRAINT IF EXISTS "FK_etudiant_td_groupe"
    `);

    await queryRunner.query(`
      ALTER TABLE "etudiant"
      DROP CONSTRAINT IF EXISTS "FK_etudiant_tp_groupe"
    `);

    // 2. Drop the columns
    await queryRunner.query(`
      ALTER TABLE "etudiant"
      DROP COLUMN IF EXISTS "td_groupe_id",
      DROP COLUMN IF EXISTS "tp_groupe_id"
    `);
  }
}
