// Import data source
import { AppDataSource } from "./data-source";

// SQL to create the table
const createTableSQL = `
-- Check if enum exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_responsable_role') THEN
    CREATE TYPE section_responsable_role AS ENUM ('filiere', 'section', 'td', 'tp');
  END IF;
END
$$;

-- Create section_responsables table
CREATE TABLE IF NOT EXISTS section_responsables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role section_responsable_role NOT NULL DEFAULT 'section',
  "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "sectionId" UUID NOT NULL,
  "enseignantId" UUID NOT NULL,
  CONSTRAINT fk_section FOREIGN KEY ("sectionId") REFERENCES sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_enseignant FOREIGN KEY ("enseignantId") REFERENCES enseignants(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_section_responsables_section ON section_responsables("sectionId");
CREATE INDEX IF NOT EXISTS idx_section_responsables_enseignant ON section_responsables("enseignantId");

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_section_role') THEN
    ALTER TABLE section_responsables ADD CONSTRAINT unique_section_role UNIQUE ("sectionId", role);
  END IF;
END
$$;
`;

// Initialize the data source and run the migration
async function main() {
  try {
    // Initialize data source
    console.log("Initializing data source...");
    await AppDataSource.initialize();
    console.log("Data source initialized successfully.");

    // Execute SQL
    console.log("Creating section_responsables table...");
    await AppDataSource.query(createTableSQL);
    console.log("Section responsables table created successfully.");
  } catch (error) {
    console.error("Error creating section_responsables table:", error);
  } finally {
    // Close the connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Data source connection closed.");
    }
  }
}

// Run the script
main();
