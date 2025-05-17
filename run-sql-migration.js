/**
 * Run SQL Migration Script
 * 
 * This script runs the SQL migration directly without requiring psql.
 */
const fs = require('fs');
const path = require('path');

// Wait for module loading
async function runMigration() {
  try {
    console.log('Loading application data source...');
    
    // Import the app's data source
    const { AppDataSource } = require('./dist/data-source');
    
    // Initialize the connection
    await AppDataSource.initialize();
    console.log('Connected to database');
    
    console.log('Running SQL migration...');
    
    // Run the SQL commands
    await AppDataSource.query(`
      -- Add document storage columns to change_request table
      ALTER TABLE "change_request" 
        ADD COLUMN IF NOT EXISTS "document_data" BYTEA,
        ADD COLUMN IF NOT EXISTS "document_name" character varying,
        ADD COLUMN IF NOT EXISTS "document_mime_type" character varying;
    `);
    console.log('- Added columns to change_request table');
    
    await AppDataSource.query(`
      -- Create index for faster document searches
      CREATE INDEX IF NOT EXISTS idx_change_request_document_name ON "change_request" ("document_name");
    `);
    console.log('- Created index on document_name');
    
    // Check if the migration already exists in the migrations table
    const existingMigration = await AppDataSource.query(`
      SELECT * FROM migrations WHERE name = 'AddDocumentBinaryStorage1721736000000'
    `);
    
    if (existingMigration.length === 0) {
      await AppDataSource.query(`
        -- Add this to migrations table so TypeORM knows it was applied
        INSERT INTO migrations (timestamp, name)
        VALUES ('1721736000000', 'AddDocumentBinaryStorage1721736000000');
      `);
      console.log('- Added migration record to migrations table');
    } else {
      console.log('- Migration record already exists');
    }
    
    console.log('SQL migration completed successfully!');
    console.log('\nYou can now run the document migration:');
    console.log('node migrate-documents-fixed.js');
    
    // Close the connection
    await AppDataSource.destroy();
    
  } catch (error) {
    console.error('Error running SQL migration:', error);
  }
}

runMigration(); 