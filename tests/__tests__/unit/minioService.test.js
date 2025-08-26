const MinioService = require('../../../src/services/minioService');

// Mock the minio client
jest.mock('minio', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
      presignedGetObject: jest.fn(),
      removeObject: jest.fn(),
      listObjects: jest.fn(),
      statObject: jest.fn()
    }))
  };
});

describe('MinioService', () => {
  let minioService;
  let mockClient;

  beforeEach(() => {
    minioService = new MinioService();
    mockClient = minioService.client;
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    test('should create bucket if it does not exist', async () => {
      mockClient.bucketExists.mockResolvedValue(false);
      mockClient.makeBucket.mockResolvedValue();

      await minioService.initialize();

      expect(mockClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockClient.makeBucket).toHaveBeenCalledWith('test-bucket');
    });

    test('should not create bucket if it already exists', async () => {
      mockClient.bucketExists.mockResolvedValue(true);

      await minioService.initialize();

      expect(mockClient.bucketExists).toHaveBeenCalledWith('test-bucket');
      expect(mockClient.makeBucket).not.toHaveBeenCalled();
    });

    test('should throw error if initialization fails', async () => {
      mockClient.bucketExists.mockRejectedValue(new Error('Connection failed'));

      await expect(minioService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('generateUniqueFilename', () => {
    test('should generate unique filename with timestamp and UUID', () => {
      const originalName = 'test-video.mp4';
      const uniqueName = minioService.generateUniqueFilename(originalName);

      expect(uniqueName).toMatch(/^test-video_\d+_[a-f0-9]{8}\.mp4$/);
    });

    test('should handle files without extension', () => {
      const originalName = 'README';
      const uniqueName = minioService.generateUniqueFilename(originalName);

      expect(uniqueName).toMatch(/^README_\d+_[a-f0-9]{8}$/);
    });

    test('should handle files with multiple dots', () => {
      const originalName = 'my.test.file.txt';
      const uniqueName = minioService.generateUniqueFilename(originalName);

      expect(uniqueName).toMatch(/^my\.test\.file_\d+_[a-f0-9]{8}\.txt$/);
    });
  });

  describe('uploadFile', () => {
    const mockFile = {
      originalname: 'test.mp4',
      buffer: Buffer.from('test content'),
      size: 1024,
      mimetype: 'video/mp4'
    };

    test('should upload file successfully', async () => {
      mockClient.putObject.mockResolvedValue();

      const result = await minioService.uploadFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.originalName).toBe('test.mp4');
      expect(result.size).toBe(1024);
      expect(result.mimetype).toBe('video/mp4');
      expect(result.objectName).toMatch(/^test_\d+_[a-f0-9]{8}\.mp4$/);
    });

    test('should upload file with custom path', async () => {
      mockClient.putObject.mockResolvedValue();

      const result = await minioService.uploadFile(mockFile, 'videos/2024');

      expect(result.objectName).toMatch(/^videos\/2024\/test_\d+_[a-f0-9]{8}\.mp4$/);
    });

    test('should throw error if upload fails', async () => {
      mockClient.putObject.mockRejectedValue(new Error('Upload failed'));

      await expect(minioService.uploadFile(mockFile)).rejects.toThrow('Upload failed');
    });
  });

  describe('getPresignedUrl', () => {
    test('should generate presigned URL successfully', async () => {
      const mockUrl = 'https://minio.example.com/bucket/file.mp4?signature=abc123';
      mockClient.presignedGetObject.mockResolvedValue(mockUrl);

      const result = await minioService.getPresignedUrl('test.mp4', 3600);

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockUrl);
      expect(result.expiresIn).toBe(3600);
      expect(mockClient.presignedGetObject).toHaveBeenCalledWith('test-bucket', 'test.mp4', 3600);
    });

    test('should use default expiry if not provided', async () => {
      const mockUrl = 'https://minio.example.com/bucket/file.mp4?signature=abc123';
      mockClient.presignedGetObject.mockResolvedValue(mockUrl);

      await minioService.getPresignedUrl('test.mp4');

      expect(mockClient.presignedGetObject).toHaveBeenCalledWith('test-bucket', 'test.mp4', 3600);
    });

    test('should throw error if URL generation fails', async () => {
      mockClient.presignedGetObject.mockRejectedValue(new Error('URL generation failed'));

      await expect(minioService.getPresignedUrl('test.mp4')).rejects.toThrow('Failed to generate URL');
    });
  });

  describe('deleteFile', () => {
    test('should delete file successfully', async () => {
      mockClient.removeObject.mockResolvedValue();

      const result = await minioService.deleteFile('test.mp4');

      expect(result.success).toBe(true);
      expect(mockClient.removeObject).toHaveBeenCalledWith('test-bucket', 'test.mp4');
    });

    test('should throw error if deletion fails', async () => {
      mockClient.removeObject.mockRejectedValue(new Error('Delete failed'));

      await expect(minioService.deleteFile('test.mp4')).rejects.toThrow('Delete failed');
    });
  });

  describe('getFileInfo', () => {
    test('should get file info successfully', async () => {
      const mockStat = {
        size: 1024,
        lastModified: new Date(),
        etag: 'abc123',
        metaData: {
          'content-type': 'video/mp4',
          'original-name': 'test.mp4',
          'upload-date': '2024-01-01T00:00:00.000Z'
        }
      };
      mockClient.statObject.mockResolvedValue(mockStat);

      const result = await minioService.getFileInfo('test.mp4');

      expect(result.success).toBe(true);
      expect(result.info.size).toBe(1024);
      expect(result.info.contentType).toBe('video/mp4');
    });

    test('should throw error if file info retrieval fails', async () => {
      mockClient.statObject.mockRejectedValue(new Error('File not found'));

      await expect(minioService.getFileInfo('test.mp4')).rejects.toThrow('File info failed');
    });
  });
});