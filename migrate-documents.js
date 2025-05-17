/**
 * Document Migration Script
 * 
 * This script reads documents from the uploads directory and stores them in the database.
 * It's designed to be run as a one-time migration task.
 */
const fs = require('fs');
const path = require('path');
const { createConnection, getRepository } = require('typeorm');
const { ChangeRequest } = require('./dist/change-request/change-request.entity');

async function migrateDocuments() {
  console.log('Starting document migration...');
  
  try {
    // Connect to database using TypeORM configuration
    const connection = await createConnection();
    console.log('Connected to database');
    
    // Get repository for change requests
    const changeRequestRepo = getRepository(ChangeRequest);
    
    // Get all requests with documentPath but no documentData
    const requestsToMigrate = await changeRequestRepo.find({
      where: {
        documentData: null
      },
      select: ['id', 'documentPath']
    });
    
    console.log(`Found ${requestsToMigrate.length} documents to migrate`);
    
    // Process each request
    let success = 0;
    let failed = 0;
    
    for (const request of requestsToMigrate) {
      if (!request.documentPath) continue;
      
      try {
        // Get file path, removing any leading slash
        const filePath = path.join(
          __dirname, 
          'uploads', 
          path.basename(request.documentPath.replace(/^\/uploads\//, ''))
        );
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          failed++;
          continue;
        }
        
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
        
        // Save to database
        await changeRequestRepo.update(
          { id: request.id },
          { 
            documentData,
            documentName,
            documentMimeType
          }
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
    await connection.close();
    
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

// Run the migration
migrateDocuments(); 