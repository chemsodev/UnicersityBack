import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentBinaryStorage1721736000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new binary data columns
        await queryRunner.query(`
            ALTER TABLE "change_request" 
            ADD COLUMN IF NOT EXISTS "document_data" BYTEA,
            ADD COLUMN IF NOT EXISTS "document_name" character varying,
            ADD COLUMN IF NOT EXISTS "document_mime_type" character varying
        `);
        
        // Create index for faster searches
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_change_request_document_name 
            ON "change_request" ("document_name")
        `);
        
        // Transfer existing data if possible (this depends on your setup)
        // This will try to read files from the uploads directory and store them in the database
        await queryRunner.query(`
            -- You may need custom scripts to migrate existing files
            -- This is a placeholder for any data migration logic
            -- For PostgreSQL, you might use something like:
            -- UPDATE change_request 
            -- SET document_data = pg_read_binary_file(document_path)
            -- WHERE document_path IS NOT NULL;
        `);
        
        // Don't remove document_path immediately to ensure backward compatibility
        // You can add a separate migration later to remove it after ensuring everything works
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index first
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_change_request_document_name
        `);
        
        // Remove the columns
        await queryRunner.query(`
            ALTER TABLE "change_request" 
            DROP COLUMN IF EXISTS "document_data",
            DROP COLUMN IF EXISTS "document_name",
            DROP COLUMN IF EXISTS "document_mime_type"
        `);
    }
} 