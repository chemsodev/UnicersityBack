import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableUUIDAndCreateSchedules1716570000002
  implements MigrationInterface
{
  name = "EnableUUIDAndCreateSchedules1716570000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create ScheduleType enum if it doesn't exist
    await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduletype') THEN
                    CREATE TYPE scheduletype AS ENUM ('regular', 'exam', 'special');
                END IF;
            END
            $$;
        `);

    // Create schedules table
    await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "schedules" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "scheduleType" scheduletype NOT NULL DEFAULT 'regular',
                "title" VARCHAR(255) NOT NULL,
                "description" TEXT,
                "document_data" BYTEA,
                "document_name" VARCHAR(255),
                "document_mime_type" VARCHAR(100),
                "sectionId" UUID,
                "uploadedById" INTEGER,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "academicYear" VARCHAR(9),
                "semester" VARCHAR(2),
                "weekNumber" INTEGER,
                CONSTRAINT "fk_schedule_section" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_schedule_enseignant" FOREIGN KEY ("uploadedById") REFERENCES "enseignants"("id") ON DELETE SET NULL
            );
        `);

    // Create indexes for better performance
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_schedules_section" ON "schedules"("sectionId");
            CREATE INDEX IF NOT EXISTS "idx_schedules_uploaded_by" ON "schedules"("uploadedById");
            CREATE INDEX IF NOT EXISTS "idx_schedules_type" ON "schedules"("scheduleType");
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the schedules table
    await queryRunner.query(`DROP TABLE IF EXISTS "schedules"`);

    // Drop the ScheduleType enum
    await queryRunner.query(`DROP TYPE IF EXISTS scheduletype`);

    // Note: We don't drop the uuid-ossp extension as it might be used by other tables
  }
}
