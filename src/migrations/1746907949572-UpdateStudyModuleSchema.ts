import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateStudyModuleSchema1746907949572 implements MigrationInterface {
    name = 'UpdateStudyModuleSchema1746907949572'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints that depend on the primary key
        await queryRunner.query(`ALTER TABLE "module_enseignants" DROP CONSTRAINT IF EXISTS "FK_module_enseignants_study_module"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT IF EXISTS "FK_notes_study_module"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "FK_schedules_study_module"`);

        // Add new columns if not exist
        await queryRunner.query(`ALTER TABLE "study_modules" ADD COLUMN IF NOT EXISTS "name" varchar`);
        await queryRunner.query(`ALTER TABLE "study_modules" ADD COLUMN IF NOT EXISTS "code" varchar`);

        // Copy data from old columns to new columns
        await queryRunner.query(`UPDATE "study_modules" SET "name" = "title" WHERE "title" IS NOT NULL`);
        await queryRunner.query(`UPDATE "study_modules" SET "code" = "type" WHERE "type" IS NOT NULL`);

        // Set NOT NULL and DEFAULT for new columns
        await queryRunner.query(`ALTER TABLE "study_modules" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "study_modules" ALTER COLUMN "name" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "study_modules" ALTER COLUMN "code" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "study_modules" ALTER COLUMN "code" SET DEFAULT ''`);

        // Drop old columns
        await queryRunner.query(`ALTER TABLE "study_modules" DROP COLUMN IF EXISTS "title"`);
        await queryRunner.query(`ALTER TABLE "study_modules" DROP COLUMN IF EXISTS "type"`);

        // Re-add foreign key constraints
        await queryRunner.query(`ALTER TABLE "module_enseignants" 
            ADD CONSTRAINT "FK_module_enseignants_study_module" 
            FOREIGN KEY ("studyModuleId") REFERENCES "study_modules"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "notes" 
            ADD CONSTRAINT "FK_notes_study_module" 
            FOREIGN KEY ("moduleId") REFERENCES "study_modules"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "schedules" 
            ADD CONSTRAINT "FK_schedules_study_module" 
            FOREIGN KEY ("moduleId") REFERENCES "study_modules"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "module_enseignants" DROP CONSTRAINT IF EXISTS "FK_module_enseignants_study_module"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT IF EXISTS "FK_notes_study_module"`);
        await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "FK_schedules_study_module"`);

        // Revert changes to study_modules table
        await queryRunner.query(`ALTER TABLE "study_modules" ADD COLUMN IF NOT EXISTS "title" varchar`);
        await queryRunner.query(`ALTER TABLE "study_modules" ADD COLUMN IF NOT EXISTS "type" varchar`);
        await queryRunner.query(`UPDATE "study_modules" SET "title" = "name" WHERE "name" IS NOT NULL`);
        await queryRunner.query(`UPDATE "study_modules" SET "type" = "code" WHERE "code" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "study_modules" ALTER COLUMN "title" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "study_modules" ALTER COLUMN "title" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "study_modules" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "study_modules" ALTER COLUMN "type" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "study_modules" DROP COLUMN IF EXISTS "name"`);
        await queryRunner.query(`ALTER TABLE "study_modules" DROP COLUMN IF EXISTS "code"`);

        // Re-add foreign key constraints
        await queryRunner.query(`ALTER TABLE "module_enseignants" 
            ADD CONSTRAINT "FK_module_enseignants_study_module" 
            FOREIGN KEY ("studyModuleId") REFERENCES "study_modules"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "notes" 
            ADD CONSTRAINT "FK_notes_study_module" 
            FOREIGN KEY ("moduleId") REFERENCES "study_modules"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "schedules" 
            ADD CONSTRAINT "FK_schedules_study_module" 
            FOREIGN KEY ("moduleId") REFERENCES "study_modules"("id") ON DELETE CASCADE`);
    }
}
