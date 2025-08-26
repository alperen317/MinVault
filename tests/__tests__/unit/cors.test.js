const request = require('supertest');
const app = require('../../../src/app');

// Mock MinioService for CORS tests
jest.mock('../../../src/services/minioService');

describe('CORS Configuration', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.CORS_ORIGIN;
  });

  afterEach(() => {
    // Clean up module cache
    delete require.cache[require.resolve('../../../src/config')];
  });

  test('should allow single origin', async () => {
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    
    const response = await request(app)
      .options('/api/files/upload')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('should allow multiple origins', async () => {
    process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001,https://example.com';
    
    // Test first origin
    const response1 = await request(app)
      .options('/api/files/upload')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response1.headers['access-control-allow-origin']).toBe('http://localhost:3000');

    // Test second origin
    const response2 = await request(app)
      .options('/api/files/upload')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response2.headers['access-control-allow-origin']).toBe('https://example.com');
  });

  test('should reject unauthorized origin', async () => {
    process.env.CORS_ORIGIN = 'http://localhost:3000,https://example.com';
    
    const response = await request(app)
      .options('/api/files/upload')
      .set('Origin', 'https://malicious-site.com')
      .set('Access-Control-Request-Method', 'POST')
      .expect(500);

    expect(response.text).toContain('Not allowed by CORS');
  });

  test('should allow wildcard origin', async () => {
    process.env.CORS_ORIGIN = '*';
    
    const response = await request(app)
      .options('/api/files/upload')
      .set('Origin', 'https://any-domain.com')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('https://any-domain.com');
  });

  test('should allow requests with no origin', async () => {
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    
    // Requests without origin (like mobile apps, curl, etc.)
    const response = await request(app)
      .get('/api/files/health')
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('should expose custom headers', async () => {
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    
    const response = await request(app)
      .options('/api/files/upload')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    expect(response.headers['access-control-allow-headers']).toContain('X-Requested-With');
  });

  test('should allow credentials', async () => {
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    
    const response = await request(app)
      .options('/api/files/upload')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  test('should handle malformed CORS_ORIGIN environment variable', async () => {
    process.env.CORS_ORIGIN = 'http://localhost:3000, , https://example.com,';
    
    const response = await request(app)
      .options('/api/files/upload')
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
  });
});