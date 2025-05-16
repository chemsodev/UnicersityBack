-- Migration to remove obsolete fields from users table
ALTER TABLE users
DROP COLUMN IF EXISTS groupe_id,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS id_enseignant;

-- Drop any foreign keys referencing groupe_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_groupe_id'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT fk_groupe_id;
  END IF;
END $$;

-- Drop any foreign keys referencing id_enseignant
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_id_enseignant'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT fk_id_enseignant;
  END IF;
END $$;