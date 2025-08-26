const request = require('supertest');
const app = require('../../../src/app');

describe('Swagger Documentation', () => {
  test('should serve Swagger UI at /api-docs', async () => {
    const response = await request(app)
      .get('/api-docs/')
      .expect(200);

    expect(response.text).toContain('swagger-ui');
    expect(response.text).toContain('[PROJECT_NAME] API Documentation');
  });

  test('should serve OpenAPI JSON spec', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    expect(response.body).toHaveProperty('openapi', '3.0.0');
    expect(response.body).toHaveProperty('info');
    expect(response.body.info).toHaveProperty('title', '[PROJECT_NAME] File Upload API');
    expect(response.body.info).toHaveProperty('version', '1.0.0');
  });

  test('should include all API paths in spec', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    const paths = Object.keys(response.body.paths);
    
    expect(paths).toContain('/api/files/health');
    expect(paths).toContain('/api/files/upload');
    expect(paths).toContain('/api/files/upload/multiple');
    expect(paths).toContain('/api/files/url/{filename}');
    expect(paths).toContain('/api/files/info/{filename}');
    expect(paths).toContain('/api/files/list');
    expect(paths).toContain('/api/files/{filename}');
  });

  test('should include proper HTTP methods for each endpoint', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    const paths = response.body.paths;

    // Health endpoint
    expect(paths['/api/files/health']).toHaveProperty('get');

    // Upload endpoints
    expect(paths['/api/files/upload']).toHaveProperty('post');
    expect(paths['/api/files/upload/multiple']).toHaveProperty('post');

    // File management endpoints
    expect(paths['/api/files/url/{filename}']).toHaveProperty('get');
    expect(paths['/api/files/info/{filename}']).toHaveProperty('get');
    expect(paths['/api/files/list']).toHaveProperty('get');
    expect(paths['/api/files/{filename}']).toHaveProperty('delete');
  });

  test('should include proper response schemas', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    const components = response.body.components;

    // Check if key schemas exist
    expect(components.schemas).toHaveProperty('SuccessResponse');
    expect(components.schemas).toHaveProperty('ErrorResponse');
    expect(components.schemas).toHaveProperty('FileUploadResult');
    expect(components.schemas).toHaveProperty('PresignedUrlResult');
    expect(components.schemas).toHaveProperty('FileInfo');
    expect(components.schemas).toHaveProperty('HealthStatus');
  });

  test('should include proper parameters', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    const parameters = response.body.components.parameters;

    expect(parameters).toHaveProperty('FilenameParam');
    expect(parameters).toHaveProperty('ExpiryQuery');
    expect(parameters).toHaveProperty('PrefixQuery');
    expect(parameters).toHaveProperty('LimitQuery');
  });

  test('should include proper tags', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    const tags = response.body.tags;

    expect(tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Files' }),
        expect.objectContaining({ name: 'Health' })
      ])
    );
  });

  test('should include server information', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    const servers = response.body.servers;

    expect(servers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: expect.stringContaining('localhost'),
          description: 'Development server'
        }),
        expect.objectContaining({
          url: 'https://api.yourdomain.com',
          description: 'Production server'
        })
      ])
    );
  });

  test('should include contact and license information', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    const info = response.body.info;

    expect(info).toHaveProperty('contact');
    expect(info.contact).toHaveProperty('name', 'API Support');
    expect(info.contact).toHaveProperty('email', 'support@example.com');

    expect(info).toHaveProperty('license');
    expect(info.license).toHaveProperty('name', 'MIT');
    expect(info.license).toHaveProperty('url', 'https://opensource.org/licenses/MIT');
  });

  test('should include proper error responses', async () => {
    const response = await request(app)
      .get('/api-docs/swagger.json')
      .expect(200);

    const responses = response.body.components.responses;

    expect(responses).toHaveProperty('BadRequest');
    expect(responses).toHaveProperty('NotFound');
    expect(responses).toHaveProperty('RateLimit');
    expect(responses).toHaveProperty('ServiceUnavailable');
  });

  test('root endpoint should include documentation link', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('documentation');
    expect(response.body.documentation).toContain('/api-docs');
  });
});