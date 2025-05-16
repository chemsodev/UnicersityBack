-- First, let's find out what sections are available
SELECT id, name, specialty, level FROM sections;

-- Find TD groups
SELECT id, name, type, capacity, "currentOccupancy", section_id FROM groupe WHERE type = 'td';

-- Find TP groups
SELECT id, name, type, capacity, "currentOccupancy", section_id FROM groupe WHERE type = 'tp';

-- Assuming we found a section with ID 'section-id-here' and two groups - TD with ID 'td-group-id-here' and TP with ID 'tp-group-id-here'
-- Let's insert the student into the section

-- 1. Link student to section
INSERT INTO etudiant_sections (etudiant_id, section_id)
VALUES (1549, 'section-id-here');

-- 2. Link student to a TD group (replace with actual group ID)
UPDATE etudiant
SET groupe_id = 'td-group-id-here'
WHERE id = 1549;

-- 3. Update the group occupancy
UPDATE groupe
SET "currentOccupancy" = "currentOccupancy" + 1
WHERE id = 'td-group-id-here';

-- Note: In the current model, a student can only be in one group at a time (either TD or TP).
-- To add them to both, we would need a different database structure with a many-to-many relationship.
-- For now, we'll default to TD, but this could be changed later.