import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSectionResponsableTable1716645481348
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."section_responsables_role_enum" AS ENUM('filiere', 'section', 'td', 'tp');

            CREATE TABLE "section_responsables" (
                "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
                "role" "public"."section_responsables_role_enum" NOT NULL DEFAULT 'section',
                "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "sectionId" UUID NOT NULL,
                "enseignantId" UUID NOT NULL,

                CONSTRAINT "PK_section_responsables" PRIMARY KEY ("id"),
                CONSTRAINT "FK_section_responsables_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "FK_section_responsables_enseignant" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            );

            CREATE INDEX "IDX_section_responsables_section" ON "section_responsables" ("sectionId");
            CREATE INDEX "IDX_section_responsables_enseignant" ON "section_responsables" ("enseignantId");
            CREATE UNIQUE INDEX "IDX_section_responsables_unique_role" ON "section_responsables" ("sectionId", "role");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP INDEX "IDX_section_responsables_unique_role";
            DROP INDEX "IDX_section_responsables_enseignant";
            DROP INDEX "IDX_section_responsables_section";
            DROP TABLE "section_responsables";
            DROP TYPE "public"."section_responsables_role_enum";
        `);
  }
}
