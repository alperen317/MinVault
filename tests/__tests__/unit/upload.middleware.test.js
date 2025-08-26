const multer = require('multer');
const { handleMulterError } = require('../../../src/middleware/upload');

describe('Upload Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('handleMulterError', () => {
    test('should handle LIMIT_FILE_SIZE error', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      error.code = 'LIMIT_FILE_SIZE';

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB',
        code: 'FILE_TOO_LARGE'
      });
    });

    test('should handle LIMIT_FILE_COUNT error', () => {
      const error = new multer.MulterError('LIMIT_FILE_COUNT');
      error.code = 'LIMIT_FILE_COUNT';

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many files',
        message: 'Maximum 10 files per request',
        code: 'TOO_MANY_FILES'
      });
    });

    test('should handle LIMIT_UNEXPECTED_FILE error', () => {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      error.code = 'LIMIT_UNEXPECTED_FILE';

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unexpected field',
        message: 'Unexpected file field',
        code: 'UNEXPECTED_FIELD'
      });
    });

    test('should handle file type validation error', () => {
      const error = new Error('File type image/gif is not allowed');

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid file type',
        message: 'File type image/gif is not allowed',
        code: 'INVALID_FILE_TYPE'
      });
    });

    test('should pass through non-multer errors', () => {
      const error = new Error('Some other error');

      handleMulterError(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should handle unknown multer error', () => {
      const error = new multer.MulterError('UNKNOWN_ERROR');
      error.code = 'UNKNOWN_ERROR';

      handleMulterError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Upload error',
        message: error.message,
        code: 'UPLOAD_ERROR'
      });
    });
  });
});