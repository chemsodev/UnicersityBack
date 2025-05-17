# Database Fix Instructions

This document provides instructions for fixing database issues related to type mismatches between integer and UUID fields.

## Issue Description

The main issues that have been fixed are:

1. Type mismatch between `integer` and `uuid` types for ID fields
2. Missing `section_responsables` table
3. Inconsistent types in foreign key references

## Solution Overview

The following changes were made:

1. Updated the `Schedule` entity:

   - Changed `etudiantId` and `enseignantId` types from `number` to `string` (UUID)
   - Added explicit `type: "uuid"` to column definitions

2. Updated DTOs:

   - Changed validation from `@IsNumber()` to `@IsUUID()` for ID fields

3. Added migration scripts:

   - TypeORM migration to update the database schema
   - Direct SQL script as a backup option
   - Node.js utility scripts for executing the fixes

4. Updated entity relationships:
   - Added two-way relationships between entities
   - Ensured consistent type usage across the application

## How to Apply the Fixes

### Option 1: Using TypeORM Migration (Recommended)

Run the following commands:

```bash
# Navigate to the backend directory
cd UnicersityBack

# Run the migration
npm run typeorm migration:run -- -d src/data-source.ts
```

### Option 2: Using Direct SQL Script

```bash
# Navigate to the backend directory
cd UnicersityBack

# Run the SQL script using psql
psql -U postgres -d university_db -f src/migrations/fix-type-inconsistencies.sql
```

### Option 3: Using Node.js Script

```bash
# Navigate to the backend directory
cd UnicersityBack

# Run the Node.js script
node fix-database.js
```

## Validation

After applying the fixes, you can validate the database schema using:

```bash
# Navigate to the backend directory
cd UnicersityBack

# Run the validation script
node validate-schema.js
```

## Additional Notes

1. If you encounter any issues with the existing data, you may need to migrate the data manually.

2. Make sure PostgreSQL is running and accessible with the credentials specified in the scripts.

3. The frontend code has been updated to handle UUID types correctly.

4. If the `section_responsables` table was not created by the migration, you can manually create it using:

```sql
-- Create enum type for responsable roles
CREATE TYPE section_responsable_role AS ENUM ('filiere', 'section', 'td', 'tp');

-- Create section_responsables table
CREATE TABLE section_responsables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role section_responsable_role NOT NULL DEFAULT 'section',
    "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "sectionId" UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    "enseignantId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_section_responsables_section ON section_responsables("sectionId");
CREATE INDEX idx_section_responsables_enseignant ON section_responsables("enseignantId");

-- Create unique constraint
ALTER TABLE section_responsables ADD CONSTRAINT unique_section_role UNIQUE ("sectionId", role);
```

5. You might need to install the `uuid-ossp` extension if it's not already installed:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
