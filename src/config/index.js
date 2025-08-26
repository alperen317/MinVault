require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'uploads'
  },
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '100MB',
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['video/*', 'image/*', 'application/pdf']
  },
  security: {
    corsOrigin: process.env.CORS_ORIGIN ? 
      (process.env.CORS_ORIGIN.includes(',') ? 
        process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
        process.env.CORS_ORIGIN) : 
      'http://localhost:3000',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  presignedUrl: {
    expiry: parseInt(process.env.PRESIGNED_URL_EXPIRY) || 3600
  }
};

module.exports = config;