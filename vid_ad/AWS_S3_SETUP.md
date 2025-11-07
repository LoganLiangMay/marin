# AWS S3 Setup Guide

## Current Status
✅ AWS SDK installed and configured in the application
⚠️ Waiting for AWS credentials and S3 bucket to be created

## Required Environment Variables

Add these to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-video-storage-bucket

# CloudFront CDN Configuration (Optional but recommended)
CLOUDFRONT_DISTRIBUTION_ID=your_cloudfront_distribution_id
CLOUDFRONT_DOMAIN_NAME=your_cloudfront_domain.cloudfront.net
CLOUDFRONT_OAI_ID=your_origin_access_identity_id
```

## Steps to Set Up AWS S3

### 1. Create AWS Account
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the setup process

### 2. Create S3 Bucket
1. Go to S3 Console: https://s3.console.aws.amazon.com/s3/
2. Click "Create bucket"
3. Configure bucket:
   - **Bucket name**: `your-app-video-storage` (must be globally unique)
   - **Region**: `us-east-1` (or your preferred region)
   - **Object Ownership**: ACLs disabled
   - **Block Public Access**: Keep all settings enabled (we'll use presigned URLs)
   - **Versioning**: Enable
   - **Encryption**: Enable with SSE-S3

### 3. Configure CORS
1. Go to your bucket → Permissions → CORS
2. Add this CORS configuration:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://your-production-domain.com"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-version-id"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### 4. Set Up IAM User
1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click "Users" → "Add users"
3. User name: `video-app-s3-user`
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search and select: `AmazonS3FullAccess` (for production, create a more restrictive policy)
8. Click through to create user
9. **IMPORTANT**: Save the Access Key ID and Secret Access Key

### 5. Create Custom IAM Policy (Recommended for Production)
Instead of using `AmazonS3FullAccess`, create a custom policy:

1. Go to IAM → Policies → Create policy
2. Use this JSON:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObjectVersion",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name/*",
                "arn:aws:s3:::your-bucket-name"
            ]
        }
    ]
}
```
3. Name it: `VideoAppS3Policy`
4. Attach this policy to your IAM user instead

### 6. Set Up Lifecycle Rules (Cost Optimization)
1. Go to your bucket → Management → Lifecycle rules
2. Create rule: "TransitionToIA"
   - Transition to Standard-IA after 30 days
3. Create rule: "TransitionToGlacier"
   - Transition to Glacier after 90 days
4. Create rule: "DeleteOldVersions"
   - Delete noncurrent versions after 180 days

### 7. Set Up CloudFront CDN (Optional but Recommended)
1. Go to CloudFront Console: https://console.aws.amazon.com/cloudfront/
2. Click "Create Distribution"
3. Configure:
   - **Origin Domain**: Select your S3 bucket
   - **Origin Access**: Origin access control settings (recommended)
   - **Create new OAC** if needed
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache Policy**: CachingOptimized
   - **Origin Request Policy**: CORS-S3Origin

4. After creation, note:
   - Distribution ID
   - Domain Name (xxxx.cloudfront.net)

5. Update S3 bucket policy to allow CloudFront access

## Testing the Configuration

### Test S3 Configuration Status
```bash
curl http://localhost:3000/api/s3/presigned-url
```

### Test Upload URL Generation
```bash
curl -X POST http://localhost:3000/api/s3/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upload",
    "fileName": "test-video.mp4",
    "fileType": "video/mp4",
    "fileSize": 10485760,
    "userId": "test-user",
    "projectId": "test-project"
  }'
```

## File Structure in S3

Files are organized as follows:
```
bucket/
├── videos/
│   └── {userId}/
│       └── {projectId}/
│           └── {timestamp}-{filename}
├── images/
│   └── {userId}/
│       └── {projectId}/
│           └── {timestamp}-{filename}
└── assets/
    └── {userId}/
        └── {projectId}/
            └── {timestamp}-{filename}
```

## Security Best Practices

1. **Never commit AWS credentials** - Always use environment variables
2. **Use IAM roles** in production instead of access keys when possible
3. **Enable MFA** on your AWS root account
4. **Rotate access keys** regularly
5. **Monitor usage** with AWS CloudWatch
6. **Enable S3 access logging** for audit trails
7. **Use presigned URLs** with short expiration times
8. **Implement rate limiting** on your API endpoints

## Cost Optimization Tips

1. **Use lifecycle policies** to move old files to cheaper storage
2. **Enable S3 Intelligent-Tiering** for automatic optimization
3. **Set up CloudFront** to reduce data transfer costs
4. **Monitor with AWS Cost Explorer**
5. **Delete unused objects** regularly
6. **Use S3 Select** for partial object retrieval

## Troubleshooting

### "Access Denied" Errors
- Check IAM user permissions
- Verify bucket policy
- Check CORS configuration
- Ensure credentials are correct in `.env.local`

### "No 'Access-Control-Allow-Origin' header" Errors
- Update CORS configuration on S3 bucket
- Add your domain to AllowedOrigins

### Upload Failures
- Check file size limits
- Verify file type is allowed
- Ensure presigned URL hasn't expired
- Check network connectivity

### High Costs
- Review lifecycle policies
- Check for large files that should be deleted
- Monitor data transfer with CloudWatch
- Consider using CloudFront for frequently accessed files