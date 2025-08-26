// Test utilities and helper functions

/**
 * Create a mock file object for testing
 */
function createMockFile(options = {}) {
  return {
    originalname: options.name || 'test.mp4',
    buffer: options.buffer || Buffer.from(options.content || 'test content'),
    size: options.size || (options.content ? Buffer.from(options.content).length : 12),
    mimetype: options.mimetype || 'video/mp4',
    fieldname: options.fieldname || 'file',
    encoding: options.encoding || '7bit'
  };
}

/**
 * Create multiple mock files for testing
 */
function createMockFiles(count = 2, baseOptions = {}) {
  return Array.from({ length: count }, (_, index) => 
    createMockFile({
      name: `test${index + 1}.mp4`,
      content: `test content ${index + 1}`,
      ...baseOptions
    })
  );
}

/**
 * Create a mock Express request object
 */
function createMockRequest(options = {}) {
  return {
    file: options.file || null,
    files: options.files || null,
    body: options.body || {},
    query: options.query || {},
    params: options.params || {},
    headers: options.headers || {},
    method: options.method || 'POST',
    path: options.path || '/api/files/upload',
    ...options
  };
}

/**
 * Create a mock Express response object
 */
function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    headers: {}
  };
  
  res.set = jest.fn((key, value) => {
    res.headers[key] = value;
    return res;
  });
  
  return res;
}

/**
 * Create a mock next function
 */
function createMockNext() {
  return jest.fn();
}

/**
 * Wait for a specified amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random string for testing
 */
function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a test buffer of specified size
 */
function createTestBuffer(size) {
  return Buffer.alloc(size, 'A');
}

/**
 * Validate error response format
 */
function validateErrorResponse(response, expectedCode) {
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  expect(response.body).toHaveProperty('code');
  expect(response.body).toHaveProperty('timestamp');
  
  if (expectedCode) {
    expect(response.body.code).toBe(expectedCode);
  }
}

/**
 * Validate success response format
 */
function validateSuccessResponse(response, expectedData = {}) {
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');
  
  Object.keys(expectedData).forEach(key => {
    expect(response.body.data).toHaveProperty(key, expectedData[key]);
  });
}

/**
 * Mock MinIO service with common methods
 */
function createMockMinioService() {
  return {
    uploadFile: jest.fn(),
    getPresignedUrl: jest.fn(),
    deleteFile: jest.fn(),
    listFiles: jest.fn(),
    getFileInfo: jest.fn(),
    initialize: jest.fn(),
    generateUniqueFilename: jest.fn(),
    client: {
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
      presignedGetObject: jest.fn(),
      removeObject: jest.fn(),
      listObjects: jest.fn(),
      statObject: jest.fn()
    },
    bucketName: 'test-bucket'
  };
}

/**
 * Setup common test data
 */
function getTestData() {
  return {
    uploadResult: {
      success: true,
      objectName: 'test_123456789_abcdef12.mp4',
      originalName: 'test.mp4',
      size: 1024,
      mimetype: 'video/mp4',
      uploadDate: '2024-01-01T00:00:00.000Z'
    },
    urlResult: {
      success: true,
      url: 'https://minio.example.com/test-bucket/test_123456789_abcdef12.mp4?signature=abc123',
      expiresIn: 3600,
      expiresAt: '2024-01-01T01:00:00.000Z'
    },
    fileInfo: {
      success: true,
      info: {
        name: 'test_123456789_abcdef12.mp4',
        size: 1024,
        lastModified: '2024-01-01T00:00:00.000Z',
        etag: 'abc123def456',
        contentType: 'video/mp4',
        originalName: 'test.mp4',
        uploadDate: '2024-01-01T00:00:00.000Z'
      }
    },
    listResult: {
      success: true,
      files: [
        { name: 'test1.mp4', size: 1024, lastModified: '2024-01-01T00:00:00.000Z' },
        { name: 'test2.mp4', size: 2048, lastModified: '2024-01-01T00:00:00.000Z' }
      ],
      count: 2
    }
  };
}

module.exports = {
  createMockFile,
  createMockFiles,
  createMockRequest,
  createMockResponse,
  createMockNext,
  wait,
  randomString,
  createTestBuffer,
  validateErrorResponse,
  validateSuccessResponse,
  createMockMinioService,
  getTestData
};