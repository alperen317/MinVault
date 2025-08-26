const request = require('supertest');
const app = require('../../../src/app');
const MinioService = require('../../../src/services/minioService');

// E2E tests - these would run against a real MinIO instance
// For CI/CD, you might want to skip these or use a test container

describe('File Upload E2E Tests', () => {
  let minioService;
  const testBucketName = 'test-e2e-bucket';

  // Skip E2E tests if MinIO is not available
  const skipE2E = process.env.SKIP_E2E_TESTS === 'true';

  beforeAll(async () => {
    if (skipE2E) {
      console.log('Skipping E2E tests - MinIO not available');
      return;
    }

    try {
      minioService = new MinioService();
      // Override bucket name for E2E tests
      minioService.bucketName = testBucketName;
      
      // Initialize test bucket
      await minioService.initialize();
    } catch (error) {
      console.log('MinIO not available for E2E tests, skipping...');
      process.env.SKIP_E2E_TESTS = 'true';
    }
  });

  afterAll(async () => {
    if (skipE2E || !minioService) return;

    try {
      // Clean up test bucket and files
      const files = await minioService.listFiles();
      if (files.files && files.files.length > 0) {
        for (const file of files.files) {
          await minioService.deleteFile(file.name);
        }
      }
      
      // Note: We don't delete the bucket as it might be used by other tests
    } catch (error) {
      console.log('Cleanup error:', error.message);
    }
  });

  describe('Real MinIO Integration', () => {
    beforeEach(() => {
      if (skipE2E) {
        pending('MinIO not available for E2E tests');
      }
    });

    test('should upload and retrieve a real file', async () => {
      const testContent = Buffer.from('This is a test video file content for E2E testing');
      
      // Upload file
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .attach('file', testContent, 'e2e-test.mp4')
        .expect(201);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data.objectName).toMatch(/^e2e-test_\d+_[a-f0-9]{8}\.mp4$/);

      const objectName = uploadResponse.body.data.objectName;

      // Get file info
      const infoResponse = await request(app)
        .get(`/api/files/info/${objectName}`)
        .expect(200);

      expect(infoResponse.body.success).toBe(true);
      expect(infoResponse.body.data.info.size).toBe(testContent.length);

      // Get presigned URL
      const urlResponse = await request(app)
        .get(`/api/files/url/${objectName}`)
        .expect(200);

      expect(urlResponse.body.success).toBe(true);
      expect(urlResponse.body.data.url).toContain(objectName);

      // Verify file can be accessed via presigned URL
      const fileResponse = await request(urlResponse.body.data.url)
        .get('')
        .expect(200);

      expect(fileResponse.body.toString()).toBe(testContent.toString());

      // List files
      const listResponse = await request(app)
        .get('/api/files/list')
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.files.some(f => f.name === objectName)).toBe(true);

      // Delete file
      const deleteResponse = await request(app)
        .delete(`/api/files/${objectName}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify file is deleted
      const deletedInfoResponse = await request(app)
        .get(`/api/files/info/${objectName}`)
        .expect(500);

      expect(deletedInfoResponse.body.success).toBe(false);
    }, 30000); // Increase timeout for E2E test

    test('should handle multiple file upload and cleanup', async () => {
      const files = [
        { content: Buffer.from('Video 1 content'), name: 'video1.mp4' },
        { content: Buffer.from('Video 2 content'), name: 'video2.mp4' },
        { content: Buffer.from('Image content'), name: 'image.jpg' }
      ];

      // Upload multiple files
      const uploadRequest = request(app).post('/api/files/upload/multiple');
      
      files.forEach(file => {
        uploadRequest.attach('files', file.content, file.name);
      });

      const uploadResponse = await uploadRequest.expect(201);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data.count).toBe(3);
      expect(uploadResponse.body.data.files).toHaveLength(3);

      const uploadedFiles = uploadResponse.body.data.files;

      // Verify all files were uploaded
      for (const file of uploadedFiles) {
        const infoResponse = await request(app)
          .get(`/api/files/info/${file.objectName}`)
          .expect(200);

        expect(infoResponse.body.success).toBe(true);
      }

      // Clean up uploaded files
      for (const file of uploadedFiles) {
        await request(app)
          .delete(`/api/files/${file.objectName}`)
          .expect(200);
      }
    }, 45000);

    test('should handle file upload with custom path', async () => {
      const testContent = Buffer.from('Test content with custom path');
      const customPath = 'e2e-tests/videos/2024';

      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .field('path', customPath)
        .attach('file', testContent, 'path-test.mp4')
        .expect(201);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data.objectName).toMatch(new RegExp(`^${customPath}/path-test_\\d+_[a-f0-9]{8}\\.mp4$`));

      // List files with prefix
      const listResponse = await request(app)
        .get(`/api/files/list?prefix=${customPath}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.files.length).toBeGreaterThan(0);

      // Clean up
      await request(app)
        .delete(`/api/files/${uploadResponse.body.data.objectName}`)
        .expect(200);
    }, 30000);

    test('should handle large file upload', async () => {
      // Create a larger test file (1MB)
      const largeContent = Buffer.alloc(1024 * 1024, 'A');

      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .attach('file', largeContent, 'large-file.mp4')
        .expect(201);

      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data.size).toBe(largeContent.length);

      // Verify file info
      const infoResponse = await request(app)
        .get(`/api/files/info/${uploadResponse.body.data.objectName}`)
        .expect(200);

      expect(infoResponse.body.data.info.size).toBe(largeContent.length);

      // Clean up
      await request(app)
        .delete(`/api/files/${uploadResponse.body.data.objectName}`)
        .expect(200);
    }, 60000);

    test('should generate working presigned URLs with custom expiry', async () => {
      const testContent = Buffer.from('Test content for URL expiry');

      // Upload file
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .attach('file', testContent, 'url-expiry-test.mp4')
        .expect(201);

      const objectName = uploadResponse.body.data.objectName;

      // Get presigned URL with custom expiry (1 hour)
      const urlResponse = await request(app)
        .get(`/api/files/url/${objectName}?expiry=3600`)
        .expect(200);

      expect(urlResponse.body.success).toBe(true);
      expect(urlResponse.body.data.expiresIn).toBe(3600);

      // Verify URL works
      const fileResponse = await request(urlResponse.body.data.url)
        .get('')
        .expect(200);

      expect(fileResponse.body.toString()).toBe(testContent.toString());

      // Clean up
      await request(app)
        .delete(`/api/files/${objectName}`)
        .expect(200);
    }, 30000);
  });

  describe('Health Check with Real MinIO', () => {
    test('should report healthy status when MinIO is accessible', async () => {
      if (skipE2E) {
        pending('MinIO not available for E2E tests');
      }

      const response = await request(app)
        .get('/api/files/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.minio).toBe('connected');
    });
  });
});