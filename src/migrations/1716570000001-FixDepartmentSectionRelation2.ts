import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDepartmentSectionRelation21716570000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing foreign key if it exists
    await queryRunner.query(`
            ALTER TABLE "sections"
            DROP CONSTRAINT IF EXISTS "fk_section_department"
        `);

    // Drop the department_id column if it exists
    await queryRunner.query(`
            ALTER TABLE "sections"
            DROP COLUMN IF EXISTS "department_id"
        `);

    // Add the department_id column with the correct type and constraint
    await queryRunner.query(`
            ALTER TABLE "sections"
            ADD COLUMN "department_id" INTEGER NOT NULL
        `);

    // Add the foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "sections"
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
