import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

// AWS Configuration from environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Validate required environment variables
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET_NAME) {
  console.warn('AWS S3 configuration is incomplete. Please check your environment variables.');
}

// S3 Client configuration
const s3Config: S3ClientConfig = {
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  } : undefined,
  maxAttempts: 3,
  requestHandler: {
    requestTimeout: 60000, // 60 seconds timeout
  },
};

// Create S3 client instance
export const s3Client = new S3Client(s3Config);

// Export configuration constants
export const S3_CONFIG = {
  BUCKET_NAME: AWS_S3_BUCKET_NAME || '',
  REGION: AWS_REGION,
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB max file size
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
  ],
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  UPLOAD_EXPIRY: 15 * 60, // 15 minutes for upload URLs
  DOWNLOAD_EXPIRY: 60 * 60, // 1 hour for download URLs
  CLOUDFRONT_DOMAIN: process.env.CLOUDFRONT_DOMAIN_NAME || '',
  CLOUDFRONT_DISTRIBUTION_ID: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
};

// CORS configuration for S3 bucket
export const S3_CORS_CONFIG = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3000',
        'https://localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL || '',
      ].filter(Boolean),
      ExposeHeaders: [
        'ETag',
        'x-amz-server-side-encryption',
        'x-amz-request-id',
        'x-amz-version-id',
      ],
      MaxAgeSeconds: 3000,
    },
  ],
};

// Lifecycle rules for cost optimization
export const S3_LIFECYCLE_RULES = {
  Rules: [
    {
      Id: 'TransitionToIA',
      Status: 'Enabled',
      Transitions: [
        {
          Days: 30,
          StorageClass: 'STANDARD_IA',
        },
      ],
      NoncurrentVersionTransitions: [
        {
          NoncurrentDays: 30,
          StorageClass: 'STANDARD_IA',
        },
      ],
    },
    {
      Id: 'TransitionToGlacier',
      Status: 'Enabled',
      Transitions: [
        {
          Days: 90,
          StorageClass: 'GLACIER',
        },
      ],
      NoncurrentVersionTransitions: [
        {
          NoncurrentDays: 90,
          StorageClass: 'GLACIER',
        },
      ],
    },
    {
      Id: 'DeleteOldVersions',
      Status: 'Enabled',
      NoncurrentVersionExpiration: {
        NoncurrentDays: 180,
      },
    },
  ],
};

// Bucket policy template for secure access
export const getBucketPolicy = (bucketName: string, _accountId: string) => ({
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'DenyInsecureConnections',
      Effect: 'Deny',
      Principal: '*',
      Action: 's3:*',
      Resource: [
        `arn:aws:s3:::${bucketName}/*`,
        `arn:aws:s3:::${bucketName}`,
      ],
      Condition: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    },
    {
      Sid: 'AllowCloudFrontAccess',
      Effect: 'Allow',
      Principal: {
        AWS: `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${process.env.CLOUDFRONT_OAI_ID || ''}`,
      },
      Action: 's3:GetObject',
      Resource: `arn:aws:s3:::${bucketName}/*`,
    },
  ],
});