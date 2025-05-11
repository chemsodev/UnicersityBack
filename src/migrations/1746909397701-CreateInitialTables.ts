import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1746909397701 implements MigrationInterface {
    name = 'CreateInitialTables1746909397701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create study_modules table
        await queryRunner.query(`
            CREATE TABLE "study_modules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL DEFAULT '',
                "code" character varying NOT NULL DEFAULT '',
                "coefficient" integer NOT NULL,
                "credits" integer NOT NULL,
                CONSTRAINT "PK_study_modules" PRIMARY KEY ("id")
            )
        `);

        // Create enseignants table (extends users)
        await queryRunner.query(`
            CREATE TABLE "enseignants" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "id_enseignant" character varying(50) NOT NULL,
                CONSTRAINT "UQ_enseignants_id_enseignant" UNIQUE ("id_enseignant"),
                CONSTRAINT "PK_enseignants" PRIMARY KEY ("id")
            )
        `);

        // Create module_enseignants join table
        await queryRunner.query(`
            CREATE TABLE "module_enseignants" (
                "module_id" uuid NOT NULL,
                "enseignant_id" uuid NOT NULL,
                CONSTRAINT "PK_module_enseignants" PRIMARY KEY ("module_id", "enseignant_id"),
                CONSTRAINT "FK_module_enseignants_study_module" FOREIGN KEY ("module_id") 
                    REFERENCES "study_modules"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_module_enseignants_enseignant" FOREIGN KEY ("enseignant_id") 
                    REFERENCES "enseignants"("id") ON DELETE CASCADE
            )
        `);

        // Create notes table
        await queryRunner.query(`
            CREATE TABLE "notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "moduleId" uuid NOT NULL,
                CONSTRAINT "PK_notes" PRIMARY KEY ("id"),
                CONSTRAINT "FK_notes_study_module" FOREIGN KEY ("moduleId") 
                    REFERENCES "study_modules"("id") ON DELETE CASCADE
            )
        `);

        // Create schedules table
        await queryRunner.query(`
            CREATE TABLE "schedules" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "moduleId" uuid NOT NULL,
                CONSTRAINT "PK_schedules" PRIMARY KEY ("id"),
                CONSTRAINT "FK_schedules_study_module" FOREIGN KEY ("moduleId") 
                    REFERENCES "study_modules"("id") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "schedules"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "module_enseignants"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "enseignants"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "study_modules"`);
    }
}
