import { Injectable } from '@nestjs/common';

export interface UploadedFileInfo {
  name: string;
  url: string;
  size: string;
  type: string;
}

@Injectable()
export class FileStorageService {
  private memoryStore = new Map<string, Buffer>();

  /**
   * Upload files to storage
   * Currently stores in memory, but structured to easily switch to S3
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<UploadedFileInfo[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }

  /**
   * Upload a single file to storage
   */
  async uploadFile(file: Express.Multer.File): Promise<UploadedFileInfo> {
    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const uniqueFilename = `${timestamp}-${randomSuffix}-${file.originalname}`;

    // Store in memory for now
    this.memoryStore.set(uniqueFilename, file.buffer);

    // delay 2 seconds to simulate async upload
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Return file info
    return {
      name: file.originalname,
      url: `/api/files/${uniqueFilename}`, // This would be S3 URL in production
      size: file.size.toString(),
      type: file.mimetype,
    };

    // TODO: For S3 implementation, replace above with:
    // const uploadResult = await this.s3Client.send(
    //   new PutObjectCommand({
    //     Bucket: process.env.AWS_S3_BUCKET,
    //     Key: `uploads/${uniqueFilename}`,
    //     Body: file.buffer,
    //     ContentType: file.mimetype,
    //   })
    // );
    //
    // return {
    //   name: file.originalname,
    //   url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${uniqueFilename}`,
    //   size: file.size.toString(),
    //   type: file.mimetype,
    // };
  }

  /**
   * Get file from memory storage
   * Used for serving files before S3 implementation
   */
  getFile(filename: string): Buffer | undefined {
    return this.memoryStore.get(filename);
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filename: string): Promise<void> {
    this.memoryStore.delete(filename);
    // delay 1 second to simulate async delete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: For S3 implementation:
    // await this.s3Client.send(
    //   new DeleteObjectCommand({
    //     Bucket: process.env.AWS_S3_BUCKET,
    //     Key: `uploads/${filename}`,
    //   })
    // );
  }

  /**
   * Get file URL
   */
  getFileUrl(filename: string): string {
    return `/api/files/${filename}`;

    // TODO: For S3 implementation:
    // return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
  }
}
