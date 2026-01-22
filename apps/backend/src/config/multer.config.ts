import { memoryStorage } from 'multer';

// Configure multer for file uploads
// Currently using memory storage, but structured to easily switch to S3

export const multerConfig = {
  // Use memory storage for now (files stored in memory as Buffer)
  // TODO: Switch to S3 storage when ready
  storage: memoryStorage(),

  // File filter to validate file types
  fileFilter: (
    req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `Unsupported file type: ${file.mimetype}. Allowed types: images, PDF, Word, Excel, text files`,
        ),
        false,
      );
    }
  },

  // Limit file size to 10MB
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};

// For future S3 implementation:
// import * as multerS3 from 'multer-s3';
// import { S3Client } from '@aws-sdk/client-s3';
//
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });
//
// export const multerS3Config = {
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_S3_BUCKET!,
//     metadata: (req, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req, file, cb) => {
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//       cb(null, `uploads/${uniqueSuffix}-${file.originalname}`);
//     },
//   }),
//   fileFilter: multerConfig.fileFilter,
//   limits: multerConfig.limits,
// };
