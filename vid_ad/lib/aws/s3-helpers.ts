import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_CONFIG } from './s3-config';

// Generate unique file keys
export function generateFileKey(
  userId: string,
  projectId: string,
  fileName: string,
  type: 'video' | 'image' | 'asset'
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${type}s/${userId}/${projectId}/${timestamp}-${sanitizedFileName}`;
}

// Upload file to S3 (server-side)
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
) {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD',
    });

    const result = await s3Client.send(command);
    return {
      success: true,
      key,
      etag: result.ETag,
      versionId: result.VersionId,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file to S3: ${error}`);
  }
}

// Generate presigned URL for upload
export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = S3_CONFIG.UPLOAD_EXPIRY
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw new Error(`Failed to generate upload URL: ${error}`);
  }
}

// Generate presigned URL for download
export async function generateDownloadUrl(
  key: string,
  expiresIn: number = S3_CONFIG.DOWNLOAD_EXPIRY,
  filename?: string
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: filename
        ? `attachment; filename="${filename}"`
        : undefined,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error(`Failed to generate download URL: ${error}`);
  }
}

// Generate CloudFront URL for streaming
export function generateCloudFrontUrl(key: string): string {
  if (!S3_CONFIG.CLOUDFRONT_DOMAIN) {
    throw new Error('CloudFront domain not configured');
  }
  return `https://${S3_CONFIG.CLOUDFRONT_DOMAIN}/${key}`;
}

// Download file from S3
export async function downloadFromS3(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    // Convert stream to buffer
    const streamToBuffer = async (stream: any): Promise<Buffer> => {
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    };

    const body = await streamToBuffer(response.Body);

    return {
      success: true,
      body,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      etag: response.ETag,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('S3 download error:', error);
    throw new Error(`Failed to download file from S3: ${error}`);
  }
}

// Delete file from S3
export async function deleteFromS3(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
    });

    const result = await s3Client.send(command);
    return {
      success: true,
      key,
      versionId: result.VersionId,
    };
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete file from S3: ${error}`);
  }
}

// Check if file exists in S3
export async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

// List files in S3 with prefix
export async function listFilesInS3(
  prefix: string,
  maxKeys: number = 100
) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);

    return {
      success: true,
      files: response.Contents?.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag,
      })) || [],
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
    };
  } catch (error) {
    console.error('S3 list error:', error);
    throw new Error(`Failed to list files from S3: ${error}`);
  }
}

// Copy file within S3
export async function copyInS3(
  sourceKey: string,
  destinationKey: string,
  metadata?: Record<string, string>
) {
  try {
    const command = new CopyObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      CopySource: `${S3_CONFIG.BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey,
      Metadata: metadata,
      MetadataDirective: metadata ? 'REPLACE' : 'COPY',
      ServerSideEncryption: 'AES256',
    });

    const result = await s3Client.send(command);
    return {
      success: true,
      sourceKey,
      destinationKey,
      etag: result.CopyObjectResult?.ETag,
      lastModified: result.CopyObjectResult?.LastModified,
    };
  } catch (error) {
    console.error('S3 copy error:', error);
    throw new Error(`Failed to copy file in S3: ${error}`);
  }
}

// Validate file type
export function isValidFileType(
  mimeType: string,
  fileType: 'video' | 'image'
): boolean {
  const allowedTypes = fileType === 'video'
    ? S3_CONFIG.ALLOWED_VIDEO_TYPES
    : S3_CONFIG.ALLOWED_IMAGE_TYPES;

  return allowedTypes.includes(mimeType);
}

// Validate file size
export function isValidFileSize(sizeInBytes: number): boolean {
  return sizeInBytes <= S3_CONFIG.MAX_FILE_SIZE;
}