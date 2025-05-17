/**
 * Document Migration Script (Fixed Version)
 * 
 * This script reads documents from the uploads directory and stores them in the database.
 * It uses the application's data source configuration directly.
 */
const fs = require('fs');
const path = require('path');

// Import the app's data source
const { AppDataSource } = require('./dist/data-source');

// Main migration function
async function migrateDocuments() {
  console.log('Starting document migration...');
  
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Connected to database');
    
    // Get all requests with documentPath but no documentData
    const result = await AppDataSource.query(`
      SELECT id, "documentPath" 
      FROM change_request 
      WHERE "documentPath" IS NOT NULL 
      AND ("document_data" IS NULL OR "document_name" IS NULL)
    `);
    
    const requestsToMigrate = result || [];
    console.log(`Found ${requestsToMigrate.length} documents to migrate`);
    
    // Process each request
    let success = 0;
    let failed = 0;
    
    for (const request of requestsToMigrate) {
      if (!request.documentPath) continue;
      
      try {
        // Try different path variations to find the file
        const possiblePaths = [
          // Direct path as stored
          path.join(__dirname, request.documentPath.replace(/^\//, '')),
          
          // Just the filename in uploads folder
          path.join(__dirname, 'uploads', path.basename(request.documentPath)),
          
          // Try with uploads prefix
          path.join(__dirname, 'uploads', request.documentPath.replace(/^\/uploads\//, '')),
          
          // Absolute path without leading slash
          request.documentPath.replace(/^\//, '')
        ];
        
        let filePath = null;
        let fileExists = false;
        
        // Try each path until we find one that exists
        for (const testPath of possiblePaths) {
          if (fs.existsSync(testPath)) {
            filePath = testPath;
            fileExists = true;
            break;
          }
        }
        
        if (!fileExists || !filePath) {
          console.error(`File not found for path: ${request.documentPath}`);
          console.error(`Tried paths: ${possiblePaths.join(', ')}`);
          failed++;
          continue;
        }
        
        console.log(`Processing file: ${filePath}`);
        
        // Read file into buffer
        const documentData = fs.readFileSync(filePath);
        
        // Get file name and mime type
        const documentName = path.basename(filePath);
        const extension = path.extname(documentName).toLowerCase();
        let documentMimeType;
        
        switch (extension) {
          case '.pdf':
            documentMimeType = 'application/pdf';
            break;
          case '.jpg':
          case '.jpeg':
            documentMimeType = 'image/jpeg';
            break;
          case '.png':
            documentMimeType = 'image/png';
            break;
          case '.doc':
            documentMimeType = 'application/msword';
            break;
          case '.docx':
            documentMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          default:
            documentMimeType = 'application/octet-stream';
        }
        
        // Save to database using direct query to handle binary data properly
        await AppDataSource.query(
          `UPDATE change_request 
           SET "document_data" = $1, "document_name" = $2, "document_mime_type" = $3
           WHERE id = $4`, 
          [documentData, documentName, documentMimeType, request.id]
        );
        
        console.log(`Migrated document: ${documentName}`);
        success++;
      } catch (err) {
        console.error(`Error migrating document for request ${request.id}:`, err);
        failed++;
      }
    }
    
    console.log('\nMigration complete!');
    console.log(`Successfully migrated: ${success}`);
    console.log(`Failed: ${failed}`);
    
    // Close connection
    await AppDataSource.destroy();
    
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

// Run the migration
migrateDocuments(); 