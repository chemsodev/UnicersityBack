// Middleware to handle file uploads for timetables
import { extname } from 'path';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configure storage for uploaded timetable files
export const timetableStorage = diskStorage({
  destination: './uploads/timetables',
  filename: (req, file, callback) => {
    // Generate a unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    callback(null, `timetable-${uniqueSuffix}${extname(file.originalname)}`);
  },
});

// Filter to only allow certain file types for timetables
export const timetableFileFilter = (req, file, callback) => {
  // Allow PDF, Word documents, Excel files, and images
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Format de fichier non pris en charge. Veuillez télécharger un PDF, DOC, DOCX, XLS, XLSX, JPG ou PNG.'), false);
  }
};

// Helper function to get the file size in a human-readable format
export const formatFileSize = (size) => {
  if (size < 1024) {
    return size + ' B';
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB';
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
};
