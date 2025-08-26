const Minio = require('minio');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config');

class MinioService {
  constructor() {
    this.client = new Minio.Client({
      endPoint: config.minio.endPoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey
    });
    this.bucketName = config.minio.bucketName;
  }

  async initialize() {
    try {
      const bucketExists = await this.client.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucketName);
        console.log(`✅ Bucket '${this.bucketName}' created successfully`);
      } else {
        console.log(`✅ Bucket '${this.bucketName}' already exists`);
      }
    } catch (error) {
      console.error('❌ Error initializing MinIO:', error.message);
      throw error;
    }
  }

  generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    return `${baseName}_${timestamp}_${uuid}${ext}`;
  }

  async uploadFile(file, customPath = '') {
    try {
      const uniqueFilename = this.generateUniqueFilename(file.originalname);
      const objectName = customPath ? `${customPath}/${uniqueFilename}` : uniqueFilename;

      const metaData = {
        'Content-Type': file.mimetype,
        'Original-Name': file.originalname,
        'Upload-Date': new Date().toISOString()
      };

      await this.client.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        metaData
      );

      return {
        success: true,
        objectName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error uploading file:', error.message);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async getPresignedUrl(objectName, expiry = config.presignedUrl.expiry) {
    try {
      const url = await this.client.presignedGetObject(
        this.bucketName,
        objectName,
        expiry
      );
      return {
        success: true,
        url,
        expiresIn: expiry,
        expiresAt: new Date(Date.now() + expiry * 1000).toISOString()
      };
    } catch (error) {
      console.error('❌ Error generating presigned URL:', error.message);
      throw new Error(`Failed to generate URL: ${error.message}`);
    }
  }

  async deleteFile(objectName) {
    try {
      await this.client.removeObject(this.bucketName, objectName);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('❌ Error deleting file:', error.message);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async listFiles(prefix = '', maxKeys = 1000) {
    try {
      const objects = [];
      const stream = this.client.listObjects(this.bucketName, prefix, true);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (objects.length < maxKeys) {
            objects.push({
              name: obj.name,
              size: obj.size,
              lastModified: obj.lastModified,
              etag: obj.etag
            });
          }
        });
        
        stream.on('end', () => {
          resolve({ success: true, files: objects, count: objects.length });
        });
        
        stream.on('error', (error) => {
          reject(new Error(`List failed: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('❌ Error listing files:', error.message);
      throw new Error(`List failed: ${error.message}`);
    }
  }

  async getFileInfo(objectName) {
    try {
      const stat = await this.client.statObject(this.bucketName, objectName);
      return {
        success: true,
        info: {
          name: objectName,
          size: stat.size,
          lastModified: stat.lastModified,
          etag: stat.etag,
          contentType: stat.metaData['content-type'],
          originalName: stat.metaData['original-name'],
          uploadDate: stat.metaData['upload-date']
        }
      };
    } catch (error) {
      console.error('❌ Error getting file info:', error.message);
      throw new Error(`File info failed: ${error.message}`);
    }
  }
}

module.exports = MinioService;