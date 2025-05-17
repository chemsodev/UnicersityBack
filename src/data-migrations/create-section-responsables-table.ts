import { DataSource } from "typeorm";
import { ResponsableRole } from "../section/section-responsable.entity";

/**
 * Migration to create the section_responsables table
 */
export async function createSectionResponsablesTable(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();

    // Check if the table already exists
    const tableExists = await queryRunner.hasTable("section_responsables");
    if (tableExists) {
      console.log(
        "Table section_responsables already exists, skipping creation"
      );
      return;
    }

    // Create enum type if not exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'responsablerole') THEN
          CREATE TYPE responsablerole AS ENUM ('filiere', 'section', 'td', 'tp');
        END IF;
      END$$;
    `);

    // Check if sections table exists
    const sectionsExists = await queryRunner.hasTable("sections");
    if (!sectionsExists) {
      console.log(
        "The sections table doesn't exist yet. Creating a basic table structure."
      );
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS sections (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Create the table with appropriate columns but without foreign key to enseignants
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS section_responsables (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "sectionId" UUID NOT NULL,
        "enseignantId" INTEGER NOT NULL,
        role VARCHAR(50) NOT NULL,
        "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_section FOREIGN KEY ("sectionId") REFERENCES sections(id) ON DELETE CASCADE
      );
    `);

    console.log("Table section_responsables created successfully");
  } catch (error) {
    console.error("Error creating section_responsables table:", error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
