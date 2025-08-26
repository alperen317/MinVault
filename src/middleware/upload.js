const multer = require('multer');
const config = require('../config');

// Convert size string to bytes
function parseSize(sizeStr) {
  const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  return parseFloat(match[1]) * units[match[2].toUpperCase()];
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedFileTypes;
  
  // Check if file type is allowed
  const isAllowed = allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.slice(0, -2);
      return file.mimetype.startsWith(baseType);
    }
    return file.mimetype === type;
  });

  if (isAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseSize(config.upload.maxFileSize),
    files: 10 // Maximum 10 files per request
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large',
          message: `Maximum file size is ${config.upload.maxFileSize}`,
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files',
          message: 'Maximum 10 files per request',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected field',
          message: 'Unexpected file field',
          code: 'UNEXPECTED_FIELD'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Upload error',
          message: error.message,
          code: 'UPLOAD_ERROR'
        });
    }
  }

  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  next(error);
};

module.exports = {
  upload,
  handleMulterError
};