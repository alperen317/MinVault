const app = require('./app');
const config = require('./config');
const MinioService = require('./services/minioService');

async function startServer() {
  try {
    // Initialize MinIO service
    console.log('🔄 Initializing MinIO service...');
    const minioService = new MinioService();
    await minioService.initialize();

    // Start the server
    const server = app.listen(config.server.port, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📡 Server running on port ${config.server.port}`);
      console.log(`🌍 Environment: ${config.server.nodeEnv}`);
      console.log(`📦 MinIO endpoint: ${config.minio.endPoint}:${config.minio.port}`);
      console.log(`🪣 Bucket: ${config.minio.bucketName}`);
      console.log(`📋 API Documentation: http://localhost:${config.server.port}/api-docs`);
      console.log('✅ Ready to accept file uploads!');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();