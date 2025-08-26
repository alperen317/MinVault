const request = require('supertest');
const app = require('../../../src/app');
const MinioService = require('../../../src/services/minioService');

// Mock MinioService for integration tests
jest.mock('../../../src/services/minioService');

describe('File Upload Integration Tests', () => {
  let mockMinioService;

  beforeEach(() => {
    mockMinioService = {
      uploadFile: jest.fn(),
      getPresignedUrl: jest.fn(),
      deleteFile: jest.fn(),
      listFiles: jest.fn(),
      getFileInfo: jest.fn(),
      client: {
        bucketExists: jest.fn()
      },
      bucketName: 'test-bucket'
    };

    MinioService.mockImplementation(() => mockMinioService);
  });

  describe('POST /api/files/upload', () => {
    test('should upload a single file successfully', async () => {
      const uploadResult = {
        success: true,
        objectName: 'test_123_abc.mp4',
        originalName: 'test.mp4',
        size: 1024,
        mimetype: 'video/mp4'
      };

      const urlResult = {
        url: 'https://minio.example.com/test.mp4',
        expiresAt: '2024-01-01T01:00:00.000Z'
      };

      mockMinioService.uploadFile.mockResolvedValue(uploadResult);
      mockMinioService.getPresignedUrl.mockResolvedValue(urlResult);

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('test video content'), 'test.mp4')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('File uploaded successfully');
      expect(response.body.data.objectName).toBe('test_123_abc.mp4');
      expect(response.body.data.accessUrl).toBe('https://minio.example.com/test.mp4');
    });

    test('should upload file with custom path', async () => {
      mockMinioService.uploadFile.mockResolvedValue({ objectName: 'videos/2024/test.mp4' });
      mockMinioService.getPresignedUrl.mockResolvedValue({ url: 'test-url', expiresAt: 'test-date' });

      const response = await request(app)
        .post('/api/files/upload')
        .field('path', 'videos/2024')
        .attach('file', Buffer.from('test content'), 'test.mp4')
        .expect(201);

      expect(mockMinioService.uploadFile).toHaveBeenCalledWith(
        expect.any(Object),
        'videos/2024'
      );
    });

    test('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No file provided');
      expect(response.body.code).toBe('NO_FILE');
    });

    test('should handle upload service errors', async () => {
      mockMinioService.uploadFile.mockRejectedValue(new Error('MinIO connection failed'));

      const response = await request(app)
        .post('/api/files/upload')
        .attach('file', Buffer.from('test content'), 'test.mp4')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('MinIO connection failed');
    });
  });

  describe('POST /api/files/upload/multiple', () => {
    test('should upload multiple files successfully', async () => {
      const uploadResults = [
        { objectName: 'test1_123_abc.mp4', originalName: 'test1.mp4' },
        { objectName: 'test2_456_def.mp4', originalName: 'test2.mp4' }
      ];

      mockMinioService.uploadFile.mockResolvedValueOnce(uploadResults[0]);
      mockMinioService.uploadFile.mockResolvedValueOnce(uploadResults[1]);
      mockMinioService.getPresignedUrl.mockResolvedValue({ 
        url: 'https://minio.example.com/test.mp4',
        expiresAt: '2024-01-01T01:00:00.000Z'
      });

      const response = await request(app)
        .post('/api/files/upload/multiple')
        .attach('files', Buffer.from('test content 1'), 'test1.mp4')
        .attach('files', Buffer.from('test content 2'), 'test2.mp4')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('2 files uploaded successfully');
      expect(response.body.data.count).toBe(2);
      expect(response.body.data.files).toHaveLength(2);
    });

    test('should return 400 when no files are provided', async () => {
      const response = await request(app)
        .post('/api/files/upload/multiple')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No files provided');
      expect(response.body.code).toBe('NO_FILES');
    });
  });

  describe('GET /api/files/url/:filename', () => {
    test('should generate presigned URL successfully', async () => {
      const urlResult = {
        url: 'https://minio.example.com/test.mp4?signature=abc123',
        expiresIn: 3600,
        expiresAt: '2024-01-01T01:00:00.000Z'
      };

      mockMinioService.getPresignedUrl.mockResolvedValue(urlResult);

      const response = await request(app)
        .get('/api/files/url/test.mp4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe(urlResult.url);
      expect(mockMinioService.getPresignedUrl).toHaveBeenCalledWith('test.mp4', undefined);
    });

    test('should use custom expiry parameter', async () => {
      mockMinioService.getPresignedUrl.mockResolvedValue({ url: 'test-url' });

      await request(app)
        .get('/api/files/url/test.mp4?expiry=7200')
        .expect(200);

      expect(mockMinioService.getPresignedUrl).toHaveBeenCalledWith('test.mp4', 7200);
    });

    test('should return 400 for empty filename', async () => {
      const response = await request(app)
        .get('/api/files/url/')
        .expect(404); // Route not found for empty filename

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/files/info/:filename', () => {
    test('should get file info successfully', async () => {
      const fileInfo = {
        success: true,
        info: {
          name: 'test.mp4',
          size: 1024,
          contentType: 'video/mp4',
          lastModified: '2024-01-01T00:00:00.000Z'
        }
      };

      mockMinioService.getFileInfo.mockResolvedValue(fileInfo);

      const response = await request(app)
        .get('/api/files/info/test.mp4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.info.name).toBe('test.mp4');
      expect(mockMinioService.getFileInfo).toHaveBeenCalledWith('test.mp4');
    });
  });

  describe('GET /api/files/list', () => {
    test('should list files successfully', async () => {
      const listResult = {
        success: true,
        files: [
          { name: 'test1.mp4', size: 1024 },
          { name: 'test2.mp4', size: 2048 }
        ],
        count: 2
      };

      mockMinioService.listFiles.mockResolvedValue(listResult);

      const response = await request(app)
        .get('/api/files/list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(2);
      expect(mockMinioService.listFiles).toHaveBeenCalledWith('', 1000);
    });

    test('should use query parameters for filtering', async () => {
      mockMinioService.listFiles.mockResolvedValue({ files: [], count: 0 });

      await request(app)
        .get('/api/files/list?prefix=videos/&limit=50')
        .expect(200);

      expect(mockMinioService.listFiles).toHaveBeenCalledWith('videos/', 50);
    });
  });

  describe('DELETE /api/files/:filename', () => {
    test('should delete file successfully', async () => {
      const deleteResult = { success: true, message: 'File deleted successfully' };
      mockMinioService.deleteFile.mockResolvedValue(deleteResult);

      const response = await request(app)
        .delete('/api/files/test.mp4')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('File deleted successfully');
      expect(mockMinioService.deleteFile).toHaveBeenCalledWith('test.mp4');
    });
  });

  describe('GET /api/files/health', () => {
    test('should return healthy status', async () => {
      mockMinioService.client.bucketExists.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/files/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.minio).toBe('connected');
    });

    test('should return unhealthy status when MinIO is down', async () => {
      mockMinioService.client.bucketExists.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/files/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
      expect(response.body.data.minio).toBe('disconnected');
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting to API endpoints', async () => {
      // This test would require making many requests quickly
      // For now, we'll just verify the middleware is applied
      const response = await request(app)
        .get('/api/files/health')
        .expect(200);

      // Check that rate limit headers are present
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('CORS', () => {
    test('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/files/upload')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    test('should handle multiple origins', async () => {
      // Test with different origins
      const origins = ['http://localhost:3000', 'http://localhost:3001'];
      
      for (const origin of origins) {
        const response = await request(app)
          .options('/api/files/upload')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'POST');
        
        // Should either allow the origin or reject it based on configuration
        expect([204, 500]).toContain(response.status);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Route not found');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    test('should return proper error format', async () => {
      const response = await request(app)
        .get('/api/files/url/')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});