-- Step 1: Add new columns for TD and TP groups
ALTER TABLE etudiant
ADD COLUMN td_groupe_id uuid NULL,
ADD COLUMN tp_groupe_id uuid NULL;

-- Step 2: Add foreign key constraints
ALTER TABLE etudiant
ADD CONSTRAINT FK_etudiant_td_groupe
FOREIGN KEY (td_groupe_id)
REFERENCES groupe(id)
ON DELETE SET NULL;

ALTER TABLE etudiant
ADD CONSTRAINT FK_etudiant_tp_groupe
FOREIGN KEY (tp_groupe_id)
REFERENCES groupe(id)
ON DELETE SET NULL;

-- Step 3: First assign students to sections if they aren't already
-- Using section with ID from the screenshot
INSERT INTO etudiant_sections (etudiant_id, section_id)
SELECT e.id, '3c737145-7726-404b-be6c-9dd98e3a7756'
FROM etudiant e
LEFT JOIN etudiant_sections es ON e.id = es.etudiant_id
WHERE es.etudiant_id IS NULL
AND e.id IN (1549, 2466); -- IDs from your example

-- Step 4: Assign TD and TP groups
-- Using the TD group from the screenshot
UPDATE etudiant
SET td_groupe_id = '30d512ce-96a5-4b8a-ade7-c2db60d6123c'
WHERE id IN (1549, 2466);

-- We need to find a TP group for the section
-- Let's get a TP group for this section if it exists
DO $$
DECLARE
    tp_group_id uuid;
BEGIN
    -- Find a TP group for the section
    SELECT id INTO tp_group_id
    FROM groupe
    WHERE type = 'tp' AND section_id = '4a18213c-b2de-497c-80e8-b3e9b7fb76d8'
    LIMIT 1;

    -- If a TP group was found, assign it to the students
    IF tp_group_id IS NOT NULL THEN
        UPDATE etudiant
        SET tp_groupe_id = tp_group_id
        WHERE id IN (1549, 2466);
    ELSE
        -- If no TP group exists, create one
        INSERT INTO groupe (id, name, type, capacity, "currentOccupancy", section_id)
        VALUES (
            gen_random_uuid(),
            'TP1',
            'tp',
            20,
            0,
            '4a18213c-b2de-497c-80e8-b3e9b7fb76d8'
        )
        RETURNING id INTO tp_group_id;

        -- Assign students to the new TP group
        UPDATE etudiant
        SET tp_groupe_id = tp_group_id
        WHERE id IN (1549, 2466);
    END IF;

    -- Update group occupancy for both TD and TP groups
    UPDATE groupe
    SET "currentOccupancy" = (
        SELECT COUNT(*)
        FROM etudiant
        WHERE td_groupe_id = groupe.id
    )
    WHERE id = '30d512ce-96a5-4b8a-ade7-c2db60d6123c';

    IF tp_group_id IS NOT NULL THEN
        UPDATE groupe
        SET "currentOccupancy" = (
            SELECT COUNT(*)
            FROM etudiant
            WHERE tp_groupe_id = groupe.id
        )
        WHERE id = tp_group_id;
    END IF;
END $$;

-- Section responsables table

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