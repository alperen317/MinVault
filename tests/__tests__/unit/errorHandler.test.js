const { errorHandler, notFoundHandler } = require('../../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/api/files/upload',
      method: 'POST'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('errorHandler', () => {
    test('should handle generic error with default values', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Something went wrong',
          code: 'INTERNAL_ERROR',
          path: '/api/files/upload',
          method: 'POST'
        })
      );
    });

    test('should handle error with custom status code', () => {
      const error = new Error('Bad request');
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bad request',
          code: 'BAD_REQUEST'
        })
      );
    });

    test('should handle ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR'
        })
      );
    });

    test('should handle UnauthorizedError', () => {
      const error = new Error('Unauthorized');
      error.name = 'UnauthorizedError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      );
    });

    test('should handle connection refused error', () => {
      const error = new Error('ECONNREFUSED: Connection refused');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Storage service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        })
      );
    });

    test('should handle NoSuchBucket error', () => {
      const error = new Error('NoSuchBucket: The specified bucket does not exist');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Storage bucket not found',
          code: 'BUCKET_NOT_FOUND'
        })
      );
    });

    test('should handle AccessDenied error', () => {
      const error = new Error('AccessDenied: Access denied');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Storage access denied',
          code: 'ACCESS_DENIED'
        })
      );
    });

    test('should include timestamp in error response', () => {
      const error = new Error('Test error');
      const beforeTime = new Date().toISOString();

      errorHandler(error, req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
    });
  });

  describe('notFoundHandler', () => {
    test('should handle 404 errors', () => {
      notFoundHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Route not found',
        code: 'NOT_FOUND',
        message: 'Cannot POST /api/files/upload',
        timestamp: expect.any(String)
      });
    });

    test('should include correct method and path', () => {
      req.method = 'GET';
      req.path = '/api/files/nonexistent';

      notFoundHandler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Cannot GET /api/files/nonexistent');
    });
  });
});