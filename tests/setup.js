// Test setup and global configurations
process.env.NODE_ENV = 'test';
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_ACCESS_KEY = 'testkey';
process.env.MINIO_SECRET_KEY = 'testsecret';
process.env.MINIO_BUCKET_NAME = 'test-bucket';
process.env.MAX_FILE_SIZE = '10MB';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};