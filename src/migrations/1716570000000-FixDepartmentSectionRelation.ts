import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDepartmentSectionRelation1716570000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, ensure the departments table exists with the correct structure
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "departments" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "description" TEXT,
                "headOfDepartment" VARCHAR(100) NOT NULL
            )
        `);

    // Add a default department if none exists
    await queryRunner.query(`
            INSERT INTO "departments" ("name", "description", "headOfDepartment")
            SELECT 'Département par défaut', 'Département par défaut pour les sections existantes', 'Administrateur'
            WHERE NOT EXISTS (SELECT 1 FROM "departments" LIMIT 1)
        `);

    // Get the ID of the default department
    const defaultDept = await queryRunner.query(`
            SELECT id FROM "departments" ORDER BY id ASC LIMIT 1
        `);
    const defaultDeptId = defaultDept[0]?.id || 1;

    // Add department_id column as nullable first
    await queryRunner.query(`
            ALTER TABLE "sections"
            DROP COLUMN IF EXISTS "department_id",
            ADD COLUMN IF NOT EXISTS "department_id" INTEGER
        `);

    // Update existing sections to use the default department
    await queryRunner.query(
      `
            UPDATE "sections"
            SET "department_id" = $1
            WHERE "department_id" IS NULL
        `,
      [defaultDeptId]
    );

    // Now make the column non-nullable and add the foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "sections"
            ALTER COLUMN "department_id" SET NOT NULL,
            ADD CONSTRAINT "fk_section_department"
            FOREIGN KEY ("department_id")
            REFERENCES "departments"("id")
            ON DELETE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "sections"
            DROP CONSTRAINT IF EXISTS "fk_section_department"
        `);

    // Remove the department_id column
    await queryRunner.query(`
            ALTER TABLE "sections"
            DROP COLUMN IF EXISTS "department_id"
        `);
  }
}
