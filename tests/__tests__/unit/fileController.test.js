const FileController = require('../../../src/controllers/fileController');

// Mock MinioService
jest.mock('../../../src/services/minioService');
const MinioService = require('../../../src/services/minioService');

describe('FileController', () => {
  let fileController;
  let mockMinioService;
  let req, res, next;

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
    
    fileController = new FileController();
    
    req = {
      file: null,
      files: null,
      body: {},
      query: {},
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  describe('uploadSingle', () => {
    test('should upload single file successfully', async () => {
      const mockFile = {
        originalname: 'test.mp4',
        buffer: Buffer.from('test'),
        size: 1024,
        mimetype: 'video/mp4'
      };

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

      req.file = mockFile;
      mockMinioService.uploadFile.mockResolvedValue(uploadResult);
      mockMinioService.getPresignedUrl.mockResolvedValue(urlResult);

      await fileController.uploadSingle(req, res, next);

      expect(mockMinioService.uploadFile).toHaveBeenCalledWith(mockFile, '');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'File uploaded successfully',
        data: {
          ...uploadResult,
          accessUrl: urlResult.url,
          urlExpiresAt: urlResult.expiresAt
        }
      });
    });

    test('should upload file with custom path', async () => {
      const mockFile = { originalname: 'test.mp4' };
      req.file = mockFile;
      req.body.path = 'videos/2024';

      mockMinioService.uploadFile.mockResolvedValue({ objectName: 'test.mp4' });
      mockMinioService.getPresignedUrl.mockResolvedValue({ url: 'test-url' });

      await fileController.uploadSingle(req, res, next);

      expect(mockMinioService.uploadFile).toHaveBeenCalledWith(mockFile, 'videos/2024');
    });

    test('should return error if no file provided', async () => {
      req.file = null;

      await fileController.uploadSingle(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No file provided',
        code: 'NO_FILE'
      });
    });

    test('should handle upload error', async () => {
      req.file = { originalname: 'test.mp4' };
      mockMinioService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      await fileController.uploadSingle(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('uploadMultiple', () => {
    test('should upload multiple files successfully', async () => {
      const mockFiles = [
        { originalname: 'test1.mp4' },
        { originalname: 'test2.mp4' }
      ];

      req.files = mockFiles;
      mockMinioService.uploadFile.mockResolvedValueOnce({ objectName: 'test1.mp4' });
      mockMinioService.uploadFile.mockResolvedValueOnce({ objectName: 'test2.mp4' });
      mockMinioService.getPresignedUrl.mockResolvedValue({ url: 'test-url', expiresAt: 'test-date' });

      await fileController.uploadMultiple(req, res, next);

      expect(mockMinioService.uploadFile).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '2 files uploaded successfully',
        data: {
          files: expect.arrayContaining([
            expect.objectContaining({ objectName: 'test1.mp4' }),
            expect.objectContaining({ objectName: 'test2.mp4' })
          ]),
          count: 2
        }
      });
    });

    test('should return error if no files provided', async () => {
      req.files = [];

      await fileController.uploadMultiple(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No files provided',
        code: 'NO_FILES'
      });
    });
  });

  describe('getFileUrl', () => {
    test('should generate presigned URL successfully', async () => {
      req.params.filename = 'test.mp4';
      const urlResult = {
        url: 'https://minio.example.com/test.mp4',
        expiresAt: '2024-01-01T01:00:00.000Z'
      };

      mockMinioService.getPresignedUrl.mockResolvedValue(urlResult);

      await fileController.getFileUrl(req, res, next);

      expect(mockMinioService.getPresignedUrl).toHaveBeenCalledWith('test.mp4', undefined);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Presigned URL generated successfully',
        data: urlResult
      });
    });

    test('should use custom expiry from query', async () => {
      req.params.filename = 'test.mp4';
      req.query.expiry = '7200';

      mockMinioService.getPresignedUrl.mockResolvedValue({ url: 'test-url' });

      await fileController.getFileUrl(req, res, next);

      expect(mockMinioService.getPresignedUrl).toHaveBeenCalledWith('test.mp4', 7200);
    });

    test('should return error if filename missing', async () => {
      req.params.filename = '';

      await fileController.getFileUrl(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Filename is required',
        code: 'MISSING_FILENAME'
      });
    });
  });

  describe('deleteFile', () => {
    test('should delete file successfully', async () => {
      req.params.filename = 'test.mp4';
      const deleteResult = { success: true, message: 'File deleted' };

      mockMinioService.deleteFile.mockResolvedValue(deleteResult);

      await fileController.deleteFile(req, res, next);

      expect(mockMinioService.deleteFile).toHaveBeenCalledWith('test.mp4');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'File deleted successfully',
        data: deleteResult
      });
    });

    test('should return error if filename missing', async () => {
      req.params.filename = '';

      await fileController.deleteFile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listFiles', () => {
    test('should list files successfully', async () => {
      const listResult = {
        success: true,
        files: [{ name: 'test1.mp4' }, { name: 'test2.mp4' }],
        count: 2
      };

      mockMinioService.listFiles.mockResolvedValue(listResult);

      await fileController.listFiles(req, res, next);

      expect(mockMinioService.listFiles).toHaveBeenCalledWith('', 1000);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Files retrieved successfully',
        data: listResult
      });
    });

    test('should use query parameters', async () => {
      req.query.prefix = 'videos/';
      req.query.limit = '50';

      mockMinioService.listFiles.mockResolvedValue({ files: [], count: 0 });

      await fileController.listFiles(req, res, next);

      expect(mockMinioService.listFiles).toHaveBeenCalledWith('videos/', 50);
    });
  });

  describe('getFileInfo', () => {
    test('should get file info successfully', async () => {
      req.params.filename = 'test.mp4';
      const infoResult = {
        success: true,
        info: { name: 'test.mp4', size: 1024 }
      };

      mockMinioService.getFileInfo.mockResolvedValue(infoResult);

      await fileController.getFileInfo(req, res, next);

      expect(mockMinioService.getFileInfo).toHaveBeenCalledWith('test.mp4');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'File info retrieved successfully',
        data: infoResult
      });
    });
  });

  describe('healthCheck', () => {
    test('should return healthy status when MinIO is accessible', async () => {
      mockMinioService.client.bucketExists.mockResolvedValue(true);

      await fileController.healthCheck(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Service is healthy',
        data: expect.objectContaining({
          status: 'healthy',
          minio: 'connected',
          bucket: 'test-bucket'
        })
      });
    });

    test('should return unhealthy status when MinIO is not accessible', async () => {
      mockMinioService.client.bucketExists.mockRejectedValue(new Error('Connection failed'));

      await fileController.healthCheck(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service unhealthy',
        code: 'SERVICE_UNHEALTHY',
        data: expect.objectContaining({
          status: 'unhealthy',
          minio: 'disconnected'
        })
      });
    });
  });
});