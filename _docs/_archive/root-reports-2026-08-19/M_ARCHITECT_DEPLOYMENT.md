# m-architect Deployment Guide - File Upload & Version Control

## Overview

This guide covers deploying m-architect with S3/R2 file storage, testing design file uploads, version control, and client collaboration features.

---

## Current Status

### Backend API
- ✅ File service: `services/api/src/modules/files/file.service.ts`
- ✅ Architect file upload routes: `services/api/src/modules/architect/architect-file-upload.routes.ts`
- ✅ Version control routes: `services/api/src/modules/architect/architect-version-control.routes.ts`
- ✅ Collaboration routes: `services/api/src/modules/architect/collaboration.routes.ts`

### Frontend (m-architect)
- ⚠️ Need to verify file upload components are connected
- ⚠️ Need to test version control features
- ⚠️ Need to test collaboration features

---

## 1. S3/R2 File Storage Setup

### Step 1: Configure Storage Provider

Choose either AWS S3 or Cloudflare R2:

#### Option A: AWS S3
```env
# Backend API .env.production
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=kealee-architect-files
S3_ENDPOINT=  # Leave empty for AWS S3
```

#### Option B: Cloudflare R2
```env
# Backend API .env.production
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=kealee-architect-files
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_REGION=auto
```

### Step 2: Create Bucket

#### AWS S3
```bash
aws s3 mb s3://kealee-architect-files --region us-east-1
aws s3api put-bucket-encryption \
  --bucket kealee-architect-files \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

#### Cloudflare R2
1. Go to Cloudflare Dashboard → R2
2. Create bucket: `kealee-architect-files`
3. Configure CORS (if needed)
4. Set up custom domain (optional)

### Step 3: Configure Bucket Policy

The file service automatically configures bucket policy, but you can also set it manually:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::kealee-architect-files/*",
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/Public": "true"
        }
      }
    },
    {
      "Sid": "DenyUnencryptedUploads",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::kealee-architect-files/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

---

## 2. File Upload Implementation

### Backend API Endpoints

#### Get Presigned URL for Upload
```bash
POST /architect/files/presigned-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileName": "design.dwg",
  "mimeType": "application/acad",
  "projectId": "project-uuid",
  "phase": "design",
  "metadata": {
    "version": "1.0",
    "description": "Initial design"
  }
}
```

Response:
```json
{
  "uploadUrl": "https://...",
  "fileId": "file-uuid",
  "key": "architect/project-uuid/design.dwg",
  "expiresIn": 3600
}
```

#### Direct File Upload
```bash
POST /architect/files
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
projectId: project-uuid
phase: design
metadata: {"version": "1.0"}
```

#### List Files
```bash
GET /architect/files?projectId=project-uuid&phase=design
Authorization: Bearer <token>
```

#### Get File Download URL
```bash
GET /architect/files/:fileId/download
Authorization: Bearer <token>
```

### Frontend Implementation

#### File Upload Component

```typescript
// apps/m-architect/components/FileUpload.tsx
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export function ArchitectFileUpload({ projectId, phase }: { projectId: string; phase: string }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  async function uploadFile(file: File) {
    setUploading(true);
    setProgress(0);

    try {
      // Get presigned URL
      const response = await fetch('/api/architect/files/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          projectId,
          phase,
        }),
      });

      const { uploadUrl, fileId } = await response.json();

      // Upload to S3/R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Confirm upload with backend
      await fetch(`/api/architect/files/${fileId}/confirm`, {
        method: 'POST',
      });

      setProgress(100);
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div {...getRootProps()} className="border-2 border-dashed p-8">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop files here...</p>
      ) : (
        <p>Drag & drop files or click to select</p>
      )}
      {uploading && <progress value={progress} max={100} />}
    </div>
  );
}
```

---

## 3. Version Control Testing

### Test Checklist

#### Step 1: Upload Initial Version
```bash
# Upload file version 1.0
POST /architect/files
{
  "projectId": "project-uuid",
  "phase": "design",
  "metadata": {
    "version": "1.0",
    "description": "Initial design"
  }
}
```

#### Step 2: Create New Version
```bash
# Create new version
POST /architect/files/:fileId/versions
{
  "version": "1.1",
  "description": "Updated design based on feedback",
  "changes": "Modified floor plan"
}
```

#### Step 3: List Versions
```bash
# Get all versions
GET /architect/files/:fileId/versions
```

Expected response:
```json
{
  "versions": [
    {
      "id": "version-uuid",
      "version": "1.1",
      "createdAt": "2024-01-15T10:00:00Z",
      "createdBy": "user-uuid",
      "description": "Updated design",
      "fileUrl": "https://..."
    },
    {
      "id": "version-uuid",
      "version": "1.0",
      "createdAt": "2024-01-10T10:00:00Z",
      "createdBy": "user-uuid",
      "description": "Initial design",
      "fileUrl": "https://..."
    }
  ]
}
```

#### Step 4: Compare Versions
```bash
# Compare two versions
GET /architect/files/:fileId/versions/:versionId1/compare/:versionId2
```

#### Step 5: Restore Version
```bash
# Restore to previous version
POST /architect/files/:fileId/versions/:versionId/restore
```

---

## 4. Client Collaboration Features

### Test Checklist

#### Step 1: Share File with Client
```bash
# Create share link
POST /architect/files/:fileId/share
{
  "clientId": "client-uuid",
  "permissions": ["view", "comment"],
  "expiresAt": "2024-02-15T10:00:00Z"
}
```

#### Step 2: Add Comment
```bash
# Add comment to file
POST /architect/files/:fileId/comments
{
  "message": "Great design! Can we add a window here?",
  "x": 100,
  "y": 200,
  "page": 1
}
```

#### Step 3: Get Comments
```bash
# Get all comments
GET /architect/files/:fileId/comments
```

#### Step 4: Markup Tools
```bash
# Add markup
POST /architect/files/:fileId/markups
{
  "type": "highlight",
  "x": 100,
  "y": 200,
  "width": 50,
  "height": 30,
  "page": 1,
  "color": "#FFFF00"
}
```

---

## 5. Deployment Checklist

### Pre-Deployment

- [ ] S3/R2 bucket created
- [ ] Bucket policy configured
- [ ] Environment variables set
- [ ] File validation rules configured
- [ ] CORS configured (if needed)

### Deployment Steps

1. **Deploy Backend API**
   ```bash
   cd services/api
   # Deploy to Railway/your platform
   ```

2. **Configure Environment Variables**
   ```env
   # Backend API
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   S3_BUCKET_NAME=kealee-architect-files
   ```

3. **Deploy Frontend**
   ```bash
   cd apps/m-architect
   npm run deploy:production
   ```

### Post-Deployment Testing

- [ ] Test file upload (small file)
- [ ] Test file upload (large file > 100MB)
- [ ] Test file type validation
- [ ] Test version control
- [ ] Test file download
- [ ] Test collaboration features
- [ ] Test file deletion
- [ ] Verify files are encrypted
- [ ] Check file cleanup scheduler

---

## 6. File Type Validation

### Supported File Types

The file service validates file types. Configure allowed types:

```typescript
// Backend: file-validation.service.ts
const ALLOWED_TYPES = [
  // CAD files
  'application/acad',
  'application/dwg',
  'application/x-dwg',
  'application/x-autocad',
  // PDF
  'application/pdf',
  // Images
  'image/png',
  'image/jpeg',
  'image/tiff',
  // Office
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
```

### File Size Limits

```typescript
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
```

---

## 7. Monitoring

### Key Metrics

1. **Upload Success Rate**
   - Monitor failed uploads
   - Check file size limits
   - Verify storage quota

2. **Storage Usage**
   - Monitor bucket size
   - Track file count
   - Set up alerts for quota

3. **Download Performance**
   - Monitor download speeds
   - Check CDN performance (if using)

4. **Version Control Activity**
   - Track version creation
   - Monitor version comparisons
   - Check restore operations

---

## 8. Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check S3/R2 credentials
   - Verify bucket exists
   - Check file size limits
   - Verify CORS configuration

2. **Download Fails**
   - Check presigned URL expiration
   - Verify file exists in bucket
   - Check permissions

3. **Version Control Issues**
   - Verify database connection
   - Check file metadata
   - Verify user permissions

---

## Next Steps

1. Set up S3/R2 storage
2. Configure environment variables
3. Deploy backend API
4. Deploy frontend
5. Test file uploads
6. Test version control
7. Test collaboration features
8. Monitor and optimize
