const express = require('express');
const FileController = require('../controllers/fileController');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();
const fileController = new FileController();

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUpload:
 *       type: object
 *       properties:
 *         file:
 *           type: string
 *           format: binary
 *           description: File to upload
 *         path:
 *           type: string
 *           description: Optional custom path for file organization
 *           example: "videos/2024"
 *     MultipleFileUpload:
 *       type: object
 *       properties:
 *         files:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: Multiple files to upload (max 10)
 *         path:
 *           type: string
 *           description: Optional custom path for file organization
 *           example: "videos/2024"
 */

/**
 * @swagger
 * /api/files/health:
 *   get:
 *     summary: Check service health
 *     description: Returns the health status of the file upload service and MinIO connection
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthStatus'
 *             example:
 *               success: true
 *               message: "Service is healthy"
 *               data:
 *                 status: "healthy"
 *                 timestamp: "2024-01-01T12:00:00.000Z"
 *                 minio: "connected"
 *                 bucket: "uploads"
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
router.get('/health', fileController.healthCheck.bind(fileController));

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a single file
 *     description: Upload a single file to MinIO storage with automatic unique naming
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/FileUpload'
 *           encoding:
 *             file:
 *               contentType: video/*, image/*, application/pdf
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileUploadResult'
 *             example:
 *               success: true
 *               message: "File uploaded successfully"
 *               data:
 *                 objectName: "video_1640995200000_abc123.mp4"
 *                 originalName: "my-video.mp4"
 *                 size: 1048576
 *                 mimetype: "video/mp4"
 *                 uploadDate: "2024-01-01T12:00:00.000Z"
 *                 accessUrl: "https://minio.example.com/bucket/video_1640995200000_abc123.mp4?signature=xyz789"
 *                 urlExpiresAt: "2024-01-01T13:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/RateLimit'
 *       500:
 *         description: Upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/upload', 
  upload.single('file'), 
  handleMulterError,
  fileController.uploadSingle.bind(fileController)
);

/**
 * @swagger
 * /api/files/upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     description: Upload multiple files (max 10) to MinIO storage with automatic unique naming
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MultipleFileUpload'
 *           encoding:
 *             files:
 *               contentType: video/*, image/*, application/pdf
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         files:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FileUploadResult'
 *                         count:
 *                           type: integer
 *                           example: 3
 *             example:
 *               success: true
 *               message: "3 files uploaded successfully"
 *               data:
 *                 files:
 *                   - objectName: "video1_1640995200000_abc123.mp4"
 *                     originalName: "video1.mp4"
 *                     size: 1048576
 *                     mimetype: "video/mp4"
 *                     uploadDate: "2024-01-01T12:00:00.000Z"
 *                     accessUrl: "https://minio.example.com/bucket/video1_1640995200000_abc123.mp4?signature=xyz789"
 *                     urlExpiresAt: "2024-01-01T13:00:00.000Z"
 *                 count: 3
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/RateLimit'
 */
router.post('/upload/multiple', 
  upload.array('files', 10), 
  handleMulterError,
  fileController.uploadMultiple.bind(fileController)
);

/**
 * @swagger
 * /api/files/url/{filename}:
 *   get:
 *     summary: Generate presigned URL for file access
 *     description: Generate a temporary, secure URL for accessing a file stored in MinIO
 *     tags: [Files]
 *     parameters:
 *       - $ref: '#/components/parameters/FilenameParam'
 *       - $ref: '#/components/parameters/ExpiryQuery'
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PresignedUrlResult'
 *             example:
 *               success: true
 *               message: "Presigned URL generated successfully"
 *               data:
 *                 url: "https://minio.example.com/bucket/video_1640995200000_abc123.mp4?signature=xyz789"
 *                 expiresIn: 3600
 *                 expiresAt: "2024-01-01T13:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Failed to generate URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/url/:filename', fileController.getFileUrl.bind(fileController));

/**
 * @swagger
 * /api/files/info/{filename}:
 *   get:
 *     summary: Get file information
 *     description: Retrieve detailed information about a specific file
 *     tags: [Files]
 *     parameters:
 *       - $ref: '#/components/parameters/FilenameParam'
 *     responses:
 *       200:
 *         description: File information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         info:
 *                           $ref: '#/components/schemas/FileInfo'
 *             example:
 *               success: true
 *               message: "File info retrieved successfully"
 *               data:
 *                 info:
 *                   name: "video_1640995200000_abc123.mp4"
 *                   size: 1048576
 *                   lastModified: "2024-01-01T12:00:00.000Z"
 *                   etag: "abc123def456"
 *                   contentType: "video/mp4"
 *                   originalName: "my-video.mp4"
 *                   uploadDate: "2024-01-01T12:00:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Failed to retrieve file info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/info/:filename', fileController.getFileInfo.bind(fileController));

/**
 * @swagger
 * /api/files/list:
 *   get:
 *     summary: List files
 *     description: Retrieve a list of files with optional filtering by prefix
 *     tags: [Files]
 *     parameters:
 *       - $ref: '#/components/parameters/PrefixQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         files:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FileListItem'
 *                         count:
 *                           type: integer
 *                           example: 25
 *             example:
 *               success: true
 *               message: "Files retrieved successfully"
 *               data:
 *                 files:
 *                   - name: "video1_1640995200000_abc123.mp4"
 *                     size: 1048576
 *                     lastModified: "2024-01-01T12:00:00.000Z"
 *                     etag: "abc123def456"
 *                   - name: "image1_1640995300000_def789.jpg"
 *                     size: 524288
 *                     lastModified: "2024-01-01T12:05:00.000Z"
 *                     etag: "def789ghi012"
 *                 count: 25
 *       500:
 *         description: Failed to list files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/list', fileController.listFiles.bind(fileController));

/**
 * @swagger
 * /api/files/{filename}:
 *   delete:
 *     summary: Delete a file
 *     description: Permanently delete a file from MinIO storage
 *     tags: [Files]
 *     parameters:
 *       - $ref: '#/components/parameters/FilenameParam'
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                           example: true
 *                         message:
 *                           type: string
 *                           example: "File deleted successfully"
 *             example:
 *               success: true
 *               message: "File deleted successfully"
 *               data:
 *                 success: true
 *                 message: "File deleted successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         description: Failed to delete file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:filename', fileController.deleteFile.bind(fileController));

module.exports = router;