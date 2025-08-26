const config = require('../../../src/config');

describe('Configuration', () => {
  beforeEach(() => {
    // Clear module cache to test different env values
    delete require.cache[require.resolve('../../../src/config')];
  });

  test('should load default configuration', () => {
    expect(config.server.port).toBe(3000);
    expect(config.minio.endPoint).toBe('localhost');
    expect(config.minio.bucketName).toBe('test-bucket');
  });

  test('should parse boolean values correctly', () => {
    process.env.MINIO_USE_SSL = 'true';
    const configWithSSL = require('../../../src/config');
    expect(configWithSSL.minio.useSSL).toBe(true);
    
    process.env.MINIO_USE_SSL = 'false';
    delete require.cache[require.resolve('../../../src/config')];
    const configWithoutSSL = require('../../../src/config');
    expect(configWithoutSSL.minio.useSSL).toBe(false);
  });

  test('should parse numeric values correctly', () => {
    process.env.PORT = '8080';
    process.env.MINIO_PORT = '9001';
    delete require.cache[require.resolve('../../../src/config')];
    const customConfig = require('../../../src/config');
    
    expect(customConfig.server.port).toBe(8080);
    expect(customConfig.minio.port).toBe(9001);
  });

  test('should handle allowed file types array', () => {
    process.env.ALLOWED_FILE_TYPES = 'image/*,video/*,application/pdf';
    delete require.cache[require.resolve('../../../src/config')];
    const customConfig = require('../../../src/config');
    
    expect(customConfig.upload.allowedFileTypes).toEqual([
      'image/*', 'video/*', 'application/pdf'
    ]);
  });
});