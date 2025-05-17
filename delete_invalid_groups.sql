-- Script to safely delete groups with names different from 1,2,3,4
-- and reassign users to valid groups

-- First, create a backup just to be safe
CREATE TABLE IF NOT EXISTS groupe_backup AS SELECT * FROM groupe;
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Begin transaction to ensure everything happens atomically
BEGIN;

-- For each group that needs to be deleted, reassign its users to valid groups
DO $$
    DECLARE
        invalid_group RECORD;
        replacement_group_id UUID;
        section_id UUID;
        group_type groupe_type_enum;  -- Use the correct enum type
    BEGIN
        -- Loop through all invalid groups (names not 1,2,3,4)
        FOR invalid_group IN
            SELECT g.id, g.name, g.type, g."sectionId"
            FROM groupe g
            WHERE g.name NOT IN ('1', '2', '3', '4')
            LOOP
                section_id := invalid_group."sectionId";
                group_type := invalid_group.type;  -- This is already the correct enum type

                RAISE NOTICE 'Processing invalid group % (name=%, type=%, section=%)', 
                    invalid_group.id, invalid_group.name, invalid_group.type, section_id;

                -- Find a replacement group of same type in same section
                SELECT id INTO replacement_group_id
                FROM groupe
                WHERE name IN ('1', '2', '3', '4')
                  AND type = group_type  -- Now comparing the same types
                  AND "sectionId" = section_id
                LIMIT 1;

                -- If no replacement found, try any group with name 1,2,3,4 in same section
                IF replacement_group_id IS NULL THEN
                    SELECT id INTO replacement_group_id
                    FROM groupe
                    WHERE name IN ('1', '2', '3', '4')
                      AND "sectionId" = section_id
                    LIMIT 1;
                    
                    RAISE NOTICE 'No same-type replacement found, using any group: %', replacement_group_id;
                END IF;

                -- If still no replacement, create a new one
                IF replacement_group_id IS NULL THEN
                    INSERT INTO groupe (name, type, "sectionId", capacity, "currentOccupancy")
                    VALUES ('1', group_type, section_id, 30, 0)
                    RETURNING id INTO replacement_group_id;

                    RAISE NOTICE 'Created new group with ID % for section %', replacement_group_id, section_id;
                END IF;

                -- Update users who reference this group as TD group
                -- We determine this based on the column they're referenced in, not the group type
                UPDATE users
                SET "td_groupe_id" = replacement_group_id
                WHERE "td_groupe_id" = invalid_group.id;
                
                RAISE NOTICE 'Updated TD references from % to %', invalid_group.id, replacement_group_id;

                -- Update users who reference this group as TP group
                UPDATE users
                SET "tp_groupe_id" = replacement_group_id
                WHERE "tp_groupe_id" = invalid_group.id;
                
                RAISE NOTICE 'Updated TP references from % to %', invalid_group.id, replacement_group_id;

                -- Update any other tables that might reference this group
                -- For change requests - current groupe
                UPDATE "change_request"
                SET "currentGroupeId" = replacement_group_id
                WHERE "currentGroupeId" = invalid_group.id;

                -- For change requests - requested groupe
                UPDATE "change_request"
                SET "requestedGroupeId" = replacement_group_id
                WHERE "requestedGroupeId" = invalid_group.id;
            END LOOP;
    END $$;

-- Now delete the invalid groups after all references have been updated
DELETE FROM groupe
WHERE name NOT IN ('1', '2', '3', '4');

-- Commit transaction
COMMIT;

-- Report the results
SELECT count(*) FROM groupe WHERE name IN ('1', '2', '3', '4'); 