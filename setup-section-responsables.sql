-- Create required extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for responsable roles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_responsable_role') THEN
    CREATE TYPE section_responsable_role AS ENUM ('filiere', 'section', 'td', 'tp');
  END IF;
END
$$;

-- Check the data type of users.id to properly create section_responsables
DO $$
DECLARE
  users_id_type TEXT;
BEGIN
  -- Get the data type of users.id column
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'id';

  -- Drop the table if it exists (uncomment if you want to force recreate)
  -- DROP TABLE IF EXISTS section_responsables;

  -- Create section_responsables table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'section_responsables') THEN
    IF users_id_type = 'integer' THEN
      -- Create with INTEGER for enseignantId
      EXECUTE '
        CREATE TABLE section_responsables (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          role section_responsable_role NOT NULL DEFAULT ''section'',
          "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "sectionId" UUID NOT NULL,
          "enseignantId" INTEGER NOT NULL,
          CONSTRAINT fk_section FOREIGN KEY ("sectionId") REFERENCES sections(id) ON DELETE CASCADE,
          CONSTRAINT fk_enseignant FOREIGN KEY ("enseignantId") REFERENCES users(id) ON DELETE CASCADE
        )
      ';
      RAISE NOTICE 'Created section_responsables table with INTEGER enseignantId';
    ELSIF users_id_type = 'uuid' THEN
      -- Create with UUID for enseignantId
      EXECUTE '
        CREATE TABLE section_responsables (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          role section_responsable_role NOT NULL DEFAULT ''section'',
          "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "sectionId" UUID NOT NULL,
          "enseignantId" UUID NOT NULL,
          CONSTRAINT fk_section FOREIGN KEY ("sectionId") REFERENCES sections(id) ON DELETE CASCADE,
          CONSTRAINT fk_enseignant FOREIGN KEY ("enseignantId") REFERENCES users(id) ON DELETE CASCADE
        )
      ';
      RAISE NOTICE 'Created section_responsables table with UUID enseignantId';
    ELSE
      RAISE EXCEPTION 'Unexpected data type for users.id: %', users_id_type;
    END IF;

    -- Create indexes for better performance
    CREATE INDEX idx_section_responsables_section ON section_responsables("sectionId");
    CREATE INDEX idx_section_responsables_enseignant ON section_responsables("enseignantId");

    -- Create unique constraint
    ALTER TABLE section_responsables ADD CONSTRAINT unique_section_role UNIQUE ("sectionId", role);
  ELSE
    RAISE NOTICE 'section_responsables table already exists';
  END IF;
END
$$;

-- Verify the table was created successfully and show its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'section_responsables'
ORDER BY ordinal_position;