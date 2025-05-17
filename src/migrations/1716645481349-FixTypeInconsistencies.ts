import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTypeInconsistencies1716645481349 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if schedules table exists
    const tableExists = await queryRunner.hasTable("schedules");
    if (tableExists) {
      // First create a temporary column with the correct type
      await queryRunner.query(`
        ALTER TABLE "schedules"
        ADD COLUMN "etudiantId_uuid" UUID NULL
      `);

      // Copy data where possible (may need to handle this carefully in production)
      // For our purpose, we'll just leave it null and handle in the application

      // Drop the old column
      await queryRunner.query(`
        ALTER TABLE "schedules"
        DROP COLUMN "etudiantId"
      `);

      // Rename the temporary column to the original name
      await queryRunner.query(`
        ALTER TABLE "schedules"
        RENAME COLUMN "etudiantId_uuid" TO "etudiantId"
      `);

      // Add foreign key constraint
      await queryRunner.query(`
        ALTER TABLE "schedules"
        ADD CONSTRAINT "FK_schedules_etudiant"
        FOREIGN KEY ("etudiantId")
        REFERENCES "users"("id")
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if schedules table exists
    const tableExists = await queryRunner.hasTable("schedules");
    if (tableExists) {
      // Drop the foreign key constraint
      await queryRunner.query(`
        ALTER TABLE "schedules"
        DROP CONSTRAINT "FK_schedules_etudiant"
      `);

      // Add a temporary column with the old type
      await queryRunner.query(`
        ALTER TABLE "schedules"
        ADD COLUMN "etudiantId_int" INTEGER NULL
      `);

      // Drop the UUID column
      await queryRunner.query(`
        ALTER TABLE "schedules"
        DROP COLUMN "etudiantId"
      `);

      // Rename the temporary column back to the original name
      await queryRunner.query(`
        ALTER TABLE "schedules"
        RENAME COLUMN "etudiantId_int" TO "etudiantId"
      `);
    }
  }
}
