-- Create enum type for responsable roles
CREATE TYPE section_responsable_role AS ENUM ('filiere', 'section', 'td', 'tp');

-- Create section_responsables table
CREATE TABLE IF NOT EXISTS section_responsables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role section_responsable_role NOT NULL DEFAULT 'section',
    "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
    "sectionId" UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    "enseignantId" UUID NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_section_responsables_section ON section_responsables("sectionId");
CREATE INDEX idx_section_responsables_enseignant ON section_responsables("enseignantId");

-- Create unique constraint to ensure a role only appears once per section
CREATE UNIQUE INDEX idx_section_responsables_unique_role ON section_responsables("sectionId", role);

-- Add comment to table
COMMENT ON TABLE section_responsables IS 'Stores relationships between sections and responsible teachers with specific roles';