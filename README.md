# [MinValult] - File Upload Service

A production-ready Node.js backend service for uploading videos and files to a self-hosted MinIO server with S3 API compatibility.

## Features

- 🚀 **Fast & Secure**: Built with Express.js and security best practices
- 📁 **File Upload**: Support for single and multiple file uploads
- 🎥 **Large Files**: Optimized for video and large file handling
- 🔒 **Secure URLs**: Generate presigned URLs for secure file access
- 🪣 **Auto Bucket Creation**: Automatically creates MinIO buckets if they don't exist
- 🔄 **Unique Filenames**: Prevents conflicts with UUID-based naming
- 🛡️ **Error Handling**: Comprehensive error handling and validation
- 📊 **Health Checks**: Built-in health monitoring endpoints
- 🔧 **Production Ready**: Rate limiting, compression, and security headers

## Quick Start

### Prerequisites

- Node.js 16+ 
- MinIO server running locally or remotely

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp .env.example .env
```

3. Configure your MinIO settings in `.env`:
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation

### Interactive Documentation

The API includes comprehensive Swagger/OpenAPI documentation:

```bash
# Start the server
npm start

# Visit the interactive documentation
http://localhost:3000/api-docs
```

**Documentation Features:**
- Interactive API explorer
- Request/response examples
- Schema definitions
- Authentication details
- Error code explanations
- Try-it-out functionality

### API Endpoints

**Base URL:** `http://localhost:3000/api/files`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/upload` | Upload single file |
| `POST` | `/upload/multiple` | Upload multiple files |
| `GET` | `/url/:filename` | Get presigned URL |
| `GET` | `/info/:filename` | Get file information |
| `GET` | `/list` | List files |
| `DELETE` | `/:filename` | Delete file |

### Quick Examples

**Single File Upload**
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@video.mp4" \
  -F "path=videos/2024"
```

**Multiple Files Upload**
```bash
curl -X POST http://localhost:3000/api/files/upload/multiple \
  -F "files=@video1.mp4" \
  -F "files=@video2.mp4"
```

**Get Secure Access URL**
```bash
curl http://localhost:3000/api/files/url/video_123456_abc.mp4?expiry=3600
```

**List Files with Filtering**
```bash
curl "http://localhost:3000/api/files/list?prefix=videos/2024&limit=50"
```

For detailed request/response schemas and examples, visit the [interactive documentation](http://localhost:3000/api-docs).

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MINIO_ENDPOINT` | MinIO server endpoint | `localhost` |
| `MINIO_PORT` | MinIO server port | `9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `MINIO_BUCKET_NAME` | Default bucket name | `uploads` |
| `MAX_FILE_SIZE` | Maximum file size | `100MB` |
| `ALLOWED_FILE_TYPES` | Comma-separated MIME types | `video/*,image/*,application/pdf` |
| `CORS_ORIGIN` | Allowed origins (single or comma-separated) | `http://localhost:3000` |

### File Upload Limits

- **Max file size**: 100MB (configurable)
- **Max files per request**: 10
- **Supported formats**: Videos, images, PDFs, documents (configurable)

## Frontend Integration

### JavaScript/Fetch Example

```javascript
// Single file upload
async function uploadFile(file, path = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (path) formData.append('path', path);

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData
  });

  return response.json();
}

// Multiple files upload
async function uploadMultipleFiles(files, path = '') {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (path) formData.append('path', path);

  const response = await fetch('/api/files/upload/multiple', {
    method: 'POST',
    body: formData
  });

  return response.json();
}
```

### React Hook Example

```javascript
import { useState } from 'react';

function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFile = async (file, path = '') => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (path) formData.append('path', path);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, error };
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "File too large",
  "code": "FILE_TOO_LARGE",
  "message": "Maximum file size is 100MB",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Common Error Codes

- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_FILE_TYPE`: File type not allowed
- `NO_FILE`: No file provided in request
- `SERVICE_UNAVAILABLE`: MinIO server unavailable
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Protection**: Multiple origin support with whitelist validation
- **Helmet Security**: Security headers for production
- **File Type Validation**: Whitelist-based file type checking
- **Size Limits**: Configurable file size restrictions
- **Presigned URLs**: Temporary, secure file access

### CORS Configuration

The service supports flexible CORS configuration:

```bash
# Single origin
CORS_ORIGIN=http://localhost:3000

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://yourdomain.com

# Allow all origins (not recommended for production)
CORS_ORIGIN=*
```

**CORS Features:**
- Multiple origin support
- Credential support for authenticated requests
- Custom headers: `Content-Type`, `Authorization`, `X-Requested-With`
- Exposed headers: `X-Total-Count`, `X-File-Count`
- Automatic handling of preflight requests

## Production Deployment

### Docker Setup

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3000
MINIO_ENDPOINT=your-minio-server.com
MINIO_USE_SSL=true
CORS_ORIGIN=https://your-frontend.com
```

**Production Documentation:**
- Swagger UI available at: `https://your-api-domain.com/api-docs`
- OpenAPI spec: `https://your-api-domain.com/api-docs/swagger.json`
- Can be integrated with API gateways and documentation portals

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run only integration tests
npm run test:integration
```

## Testing

The project includes comprehensive test coverage:

### Test Types

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test API endpoints with mocked services
- **E2E Tests**: Test complete workflows with real MinIO instance

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test suites
npm test -- --testPathPattern=unit
npm test -- --testPathPattern=integration
npm test -- --testPathPattern=e2e

# Run tests in watch mode during development
npm run test:watch
```

### Test Configuration

Tests use Jest with the following setup:
- **Test Environment**: Node.js
- **Coverage Threshold**: 80% for branches, functions, lines, and statements
- **Timeout**: 30 seconds for integration/E2E tests
- **Setup**: Automatic MinIO mocking for unit tests

### E2E Testing

E2E tests require a running MinIO instance:

```bash
# Using Docker Compose (recommended)
docker-compose up -d minio

# Or start MinIO manually
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

# Run E2E tests
npm test -- --testPathPattern=e2e
```

### CI/CD

GitHub Actions workflow automatically:
- Tests against Node.js 16, 18, and 20
- Runs unit, integration, and E2E tests
- Generates coverage reports
- Performs security audits
- Supports multiple environments

## License

MIT License - see LICENSE file for details.
