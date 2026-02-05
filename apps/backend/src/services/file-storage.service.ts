import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

export interface UploadedFileInfo {
  name: string;
  url: string;
  size: string;
  type: string;
}

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string = 'ap-southeast-2'; // AWS region from the bucket name

  constructor() {
    // Initialize S3 client with credentials from environment
    this.bucketName = process.env.AWS_ASSETS_BUCKET_NAME || '';
    
    if (!this.bucketName) {
      this.logger.warn(
        'AWS_ASSETS_BUCKET_NAME not set in environment variables',
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    this.logger.log(
      `S3 FileStorageService initialized with bucket: ${this.bucketName}`,
    );
  }

  /**
   * Upload files to S3 storage
   */
  async uploadFiles(
    files: Express.Multer.File[],
    pathPrefix = 'uploads',
  ): Promise<UploadedFileInfo[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, pathPrefix)));
  }

  /**
   * Upload a single file to S3 storage
   */
  async uploadFile(
    file: Express.Multer.File,
    pathPrefix = 'uploads',
  ): Promise<UploadedFileInfo> {
    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const uniqueFilename = `${timestamp}-${randomSuffix}-${file.originalname}`;
    const key = `${pathPrefix}/${uniqueFilename}`;

    try {
      // Upload to S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully: ${uniqueFilename}`);

      // Return file info
      return {
        name: file.originalname,
        url,
        size: file.size.toString(),
        type: file.mimetype,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${file.originalname}:`, error);
      throw error;
    }
  }

  /**
   * Delete file from S3 storage
   * @param fileUrl - Full S3 URL or just the key path
   */
  async deleteFile(fileUrl: string): Promise<void> {
    // Extract key from URL if full URL is provided
    let key: string;
    if (fileUrl.startsWith('https://')) {
      const url = new URL(fileUrl);
      key = url.pathname.substring(1); // Remove leading '/'
    } else {
      key = fileUrl;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get file URL from S3
   * @param key - S3 key path (e.g., 'session/123/raw/filename.jpg')
   */
  getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
