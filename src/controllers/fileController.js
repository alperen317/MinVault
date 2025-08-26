const MinioService = require('../services/minioService');

class FileController {
  constructor() {
    this.minioService = new MinioService();
  }

  async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file provided',
          code: 'NO_FILE'
        });
      }

      const customPath = req.body.path || req.query.path || '';
      const result = await this.minioService.uploadFile(req.file, customPath);

      // Generate presigned URL for immediate access
      const urlResult = await this.minioService.getPresignedUrl(result.objectName);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          ...result,
          accessUrl: urlResult.url,
          urlExpiresAt: urlResult.expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided',
          code: 'NO_FILES'
        });
      }

      const customPath = req.body.path || req.query.path || '';
      const uploadPromises = req.files.map(file => 
        this.minioService.uploadFile(file, customPath)
      );

      const results = await Promise.all(uploadPromises);

      // Generate presigned URLs for all uploaded files
      const urlPromises = results.map(result => 
        this.minioService.getPresignedUrl(result.objectName)
      );
      const urlResults = await Promise.all(urlPromises);

      const filesWithUrls = results.map((result, index) => ({
        ...result,
        accessUrl: urlResults[index].url,
        urlExpiresAt: urlResults[index].expiresAt
      }));

      res.status(201).json({
        success: true,
        message: `${results.length} files uploaded successfully`,
        data: {
          files: filesWithUrls,
          count: results.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getFileUrl(req, res, next) {
    try {
      const { filename } = req.params;
      const expiry = parseInt(req.query.expiry) || undefined;

      if (!filename) {
        return res.status(400).json({
          success: false,
          error: 'Filename is required',
          code: 'MISSING_FILENAME'
        });
      }

      const result = await this.minioService.getPresignedUrl(filename, expiry);

      res.json({
        success: true,
        message: 'Presigned URL generated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req, res, next) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({
          success: false,
          error: 'Filename is required',
          code: 'MISSING_FILENAME'
        });
      }

      const result = await this.minioService.deleteFile(filename);

      res.json({
        success: true,
        message: 'File deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async listFiles(req, res, next) {
    try {
      const prefix = req.query.prefix || '';
      const maxKeys = parseInt(req.query.limit) || 1000;

      const result = await this.minioService.listFiles(prefix, maxKeys);

      res.json({
        success: true,
        message: 'Files retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getFileInfo(req, res, next) {
    try {
      const { filename } = req.params;

      if (!filename) {
        return res.status(400).json({
          success: false,
          error: 'Filename is required',
          code: 'MISSING_FILENAME'
        });
      }

      const result = await this.minioService.getFileInfo(filename);

      res.json({
        success: true,
        message: 'File info retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async healthCheck(req, res, next) {
    try {
      // Test MinIO connection
      await this.minioService.client.bucketExists(this.minioService.bucketName);

      res.json({
        success: true,
        message: 'Service is healthy',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          minio: 'connected',
          bucket: this.minioService.bucketName
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Service unhealthy',
        code: 'SERVICE_UNHEALTHY',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          minio: 'disconnected'
        }
      });
    }
  }
}

module.exports = FileController;