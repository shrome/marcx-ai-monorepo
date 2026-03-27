import { Injectable } from '@nestjs/common';
import type { UploadedFileInfo } from '../../src/services/file-storage.service';

/**
 * Test stub for FileStorageService — returns a fake S3 URL
 * instead of actually uploading to AWS.
 */
@Injectable()
export class MockFileStorageService {
  async uploadFile(file: Express.Multer.File, pathPrefix: string): Promise<UploadedFileInfo> {
    return {
      name: file.originalname,
      url: `https://test-bucket.s3.amazonaws.com/${pathPrefix}/${file.originalname}`,
      size: String(file.size ?? 0),
      type: file.mimetype ?? 'application/octet-stream',
    };
  }

  async uploadFiles(files: Express.Multer.File[], pathPrefix: string): Promise<UploadedFileInfo[]> {
    return Promise.all(files.map((f) => this.uploadFile(f, pathPrefix)));
  }

  async deleteFile(_fileUrl: string): Promise<void> {
    // no-op in tests
  }
}
