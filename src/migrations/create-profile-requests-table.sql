-- Create profile_request table if it doesn't exist
CREATE TABLE IF NOT EXISTS profile_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(255) NOT NULL,
    adresse_email_personnelle VARCHAR(255),
    numero_telephone_principal VARCHAR(255),
    numero_telephone_secondaire VARCHAR(255),
    adresse_postale TEXT,
    code_postal VARCHAR(50),
    ville VARCHAR(100),
    contact_en_cas_durgence VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    admin_comment TEXT,
    processed_by_id VARCHAR(255),
    changes JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_student_id FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_request_student_id ON profile_request(student_id);
CREATE INDEX IF NOT EXISTS idx_profile_request_status ON profile_request(status);