import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserIdReferences implements MigrationInterface {
  name = "UpdateUserIdReferences1689432100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if section_responsables table exists, if not create it
    const tableExists = await queryRunner.hasTable("section_responsables");
    if (!tableExists) {
      // Create section_responsables table
      await queryRunner.query(`
        CREATE TABLE "section_responsables" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "sectionId" uuid NOT NULL,
          "enseignantId" integer NOT NULL,
          "role" "section_responsable_role" NOT NULL DEFAULT 'section',
          "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_section_responsables" PRIMARY KEY ("id"),
          CONSTRAINT "unique_section_role" UNIQUE ("sectionId", "role"),
          CONSTRAINT "FK_section_responsables_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
          CONSTRAINT "FK_section_responsables_enseignant" FOREIGN KEY ("enseignantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        )
      `);

      // Create indexes for better performance
      await queryRunner.query(`
        CREATE INDEX "IDX_section_responsables_section" ON "section_responsables" ("sectionId")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_section_responsables_enseignant" ON "section_responsables" ("enseignantId")
      `);
    }

    // Check if schedules.etudiantId is UUID, and convert to integer if needed
    try {
      const columns = await queryRunner.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'schedules' AND column_name = 'etudiantId'
      `);

      if (columns.length > 0 && columns[0].data_type === "uuid") {
        // Create a temporary column
        await queryRunner.query(
          `ALTER TABLE "schedules" ADD "etudiantId_int" integer NULL`
        );

        // Drop foreign key if exists
        await queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'FK_schedules_etudiant'
                AND table_name = 'schedules'
            ) THEN
              ALTER TABLE "schedules" DROP CONSTRAINT "FK_schedules_etudiant";
            END IF;
          END $$;
        `);

        // Drop the UUID column
        await queryRunner.query(
          `ALTER TABLE "schedules" DROP COLUMN "etudiantId"`
        );

        // Rename the integer column
        await queryRunner.query(
          `ALTER TABLE "schedules" RENAME COLUMN "etudiantId_int" TO "etudiantId"`
        );

        // Add foreign key constraint
        await queryRunner.query(`
          ALTER TABLE "schedules"
          ADD CONSTRAINT "FK_schedules_etudiant"
          FOREIGN KEY ("etudiantId")
          REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
      }
    } catch (error) {
      console.error("Error checking/updating schedules.etudiantId:", error);
    }

    // Check if schedules.enseignantId is UUID, and convert to integer if needed
    try {
      const columns = await queryRunner.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'schedules' AND column_name = 'enseignantId'
      `);

      if (columns.length > 0 && columns[0].data_type === "uuid") {
        // Create a temporary column
        await queryRunner.query(
          `ALTER TABLE "schedules" ADD "enseignantId_int" integer NULL`
        );

        // Drop foreign key if exists
        await queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'FK_schedules_enseignant'
                AND table_name = 'schedules'
            ) THEN
              ALTER TABLE "schedules" DROP CONSTRAINT "FK_schedules_enseignant";
            END IF;
          END $$;
        `);

        // Drop the UUID column
        await queryRunner.query(
          `ALTER TABLE "schedules" DROP COLUMN "enseignantId"`
        );

        // Rename the integer column
        await queryRunner.query(
          `ALTER TABLE "schedules" RENAME COLUMN "enseignantId_int" TO "enseignantId"`
        );

        // Add foreign key constraint
        await queryRunner.query(`
          ALTER TABLE "schedules"
          ADD CONSTRAINT "FK_schedules_enseignant"
          FOREIGN KEY ("enseignantId")
          REFERENCES "users"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
      }
    } catch (error) {
      console.error("Error checking/updating schedules.enseignantId:", error);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No need for detailed down migration as this is a one-way data fix
    console.log("This migration cannot be reverted automatically.");
  }
}
