# Document Storage Migration Guide

This document explains the changes made to store documents directly in the database instead of as file paths.

## Changes Made

1. **Database Schema**:
   - Added new columns to `change_request` table:
     - `document_data` (BYTEA): Stores the binary data of the document
     - `document_name` (VARCHAR): Stores the original filename
     - `document_mime_type` (VARCHAR): Stores the MIME type for proper display

2. **Backend Endpoints**:
   - Modified `/change-requests/group` endpoint to store files directly in the database
   - Added a new endpoint `/change-requests/:id/document` to retrieve document data
   - Updated ChangeRequest entity and related services

3. **Frontend**:
   - Updated document links to use the new binary data endpoint
   - Improved file upload UI with file name display
   - Added support for both legacy and new document storage methods

## Migration Steps

1. **Run the Database Migration**:

   ```bash
   npm run migration:run
   ```

   This will add the new columns to the `change_request` table.

2. **Migrate Existing Documents**:

   Run the migration script to transfer documents from the file system to the database:

   ```bash
   node migrate-documents.js
   ```

   This script:
   - Finds all requests with document paths but no document data
   - Reads the files from disk
   - Stores the binary data in the database with appropriate metadata

3. **Update Frontend Code**:

   The frontend code has been updated to handle binary document uploads and display. No additional steps are needed.

## Testing the New Implementation

1. **Verify Document Retrieval**:
   - Log in as a student
   - Navigate to "Demandes" page
   - Open a request with a document attachment
   - Verify the document opens correctly in the browser

2. **Test New Document Uploads**:
   - Create a new group change request with a document attachment
   - Verify the document is saved in the database (check with pgAdmin or similar tool)
   - Check that the document can be retrieved and viewed

## Rollback Plan

If issues occur with the binary storage implementation:

1. The system is designed to fallback to path-based storage if binary data is not available
2. To fully roll back:
   - Revert the migrations
   - Restore the previous codebase version

## Benefits of Binary Storage

1. **Improved Data Integrity**: Files are stored with the related records
2. **Better Backup/Restore**: Database backups include all documents
3. **Simplified DevOps**: No need to manage separate file storage
4. **Performance**: Reduced I/O operations for document retrieval

## Long-term Considerations

After several weeks of successful operation with binary storage:

1. Create a new migration to remove the now-unused `document_path` column
2. Clean up any unused files in the uploads directory 