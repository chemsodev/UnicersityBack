-- First check the data types of relevant columns
DO $$
DECLARE
  users_id_type TEXT;
BEGIN
  -- Check the data type of users.id
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'id';

  -- Execute appropriate fixes based on what we found
  IF users_id_type = 'integer' THEN
    -- If users.id is integer, then schedules.etudiantId should also be integer
    -- Check if schedules.etudiantId needs fixing (if it's already UUID)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'schedules' AND column_name = 'etudiantId'
      AND data_type = 'uuid'
    ) THEN
      -- Fix: Convert schedules.etudiantId back to integer to match users.id
      ALTER TABLE "schedules"
      ADD COLUMN "etudiantId_int" INTEGER NULL;

      -- Drop the UUID column (or keep both temporarily if needed)
      ALTER TABLE "schedules"
      DROP COLUMN "etudiantId";

      -- Rename the temporary column to the original name
      ALTER TABLE "schedules"
      RENAME COLUMN "etudiantId_int" TO "etudiantId";

      -- Add foreign key constraint
      ALTER TABLE "schedules"
      ADD CONSTRAINT "FK_schedules_etudiant"
      FOREIGN KEY ("etudiantId")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;

      RAISE NOTICE 'Fixed schedules.etudiantId to be INTEGER to match users.id';
    ELSE
      RAISE NOTICE 'No type mismatch detected for schedules.etudiantId and users.id';
    END IF;
  ELSIF users_id_type = 'uuid' THEN
    -- If users.id is UUID, check if schedules.etudiantId is integer
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'schedules' AND column_name = 'etudiantId'
      AND data_type = 'integer'
    ) THEN
      -- Fix: Convert schedules.etudiantId to UUID to match users.id
      ALTER TABLE "schedules"
      ADD COLUMN "etudiantId_uuid" UUID NULL;

      -- Drop the old column
      ALTER TABLE "schedules"
      DROP COLUMN "etudiantId";

      -- Rename the temporary column to the original name
      ALTER TABLE "schedules"
      RENAME COLUMN "etudiantId_uuid" TO "etudiantId";

      -- Add foreign key constraint
      ALTER TABLE "schedules"
      ADD CONSTRAINT "FK_schedules_etudiant"
      FOREIGN KEY ("etudiantId")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;

      RAISE NOTICE 'Fixed schedules.etudiantId to be UUID to match users.id';
    ELSE
      RAISE NOTICE 'No type mismatch detected for schedules.etudiantId and users.id';
    END IF;
  ELSE
    RAISE NOTICE 'Unexpected data type for users.id: %', users_id_type;
  END IF;
END $$;

-- Always create section_responsables table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'section_responsables') THEN
    -- Create enum type for responsable roles
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'section_responsable_role') THEN
      CREATE TYPE section_responsable_role AS ENUM ('filiere', 'section', 'td', 'tp');
    END IF;

    -- Create section_responsables table with appropriate ID types
    -- We'll use the same type as users.id for enseignantId
    CREATE TABLE section_responsables (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      role section_responsable_role NOT NULL DEFAULT 'section',
      "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
      "sectionId" UUID NOT NULL,
      "enseignantId" INTEGER NOT NULL, -- Assuming users.id is INTEGER based on error
      CONSTRAINT fk_section FOREIGN KEY ("sectionId") REFERENCES sections(id) ON DELETE CASCADE,
      CONSTRAINT fk_enseignant FOREIGN KEY ("enseignantId") REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes for better performance
    CREATE INDEX idx_section_responsables_section ON section_responsables("sectionId");
    CREATE INDEX idx_section_responsables_enseignant ON section_responsables("enseignantId");

    -- Add unique constraint
    ALTER TABLE section_responsables ADD CONSTRAINT unique_section_role UNIQUE ("sectionId", role);

    RAISE NOTICE 'Created section_responsables table';
  ELSE
    RAISE NOTICE 'section_responsables table already exists';
  END IF;
END$$;