'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, FileIcon, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
}

interface FileUploadProps {
  folder?: string;
  multiple?: boolean;
  maxSize?: number;
  acceptedTypes?: string[];
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export default function FileUpload({
  folder = 'uploads',
  multiple = false,
  maxSize = 100 * 1024 * 1024, // 100MB
  acceptedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*', 'text/plain'],
  onUploadComplete,
  onUploadError,
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    // Validate files
    const invalidFiles = acceptedFiles.filter(file => {
      if (file.size > maxSize) {
        return true;
      }
      
      // Check file type
      const isTypeValid = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(category);
        }
        return file.type === type;
      });
      
      return !isTypeValid;
    });

    if (invalidFiles.length > 0) {
      setError(`Some files exceed ${maxSize / 1024 / 1024}MB limit or have invalid types`);
      return;
    }

    if (!multiple && acceptedFiles.length > 1) {
      setError('Only one file can be uploaded at a time');
      return;
    }

    setFiles(prev => [...prev, ...acceptedFiles]);
  }, [multiple, maxSize, acceptedTypes]);

  // Simple drag and drop handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    onDrop(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    onDrop(selectedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('No files to upload');
      return;
    }

    setUploading(true);
    setError(null);
    const uploaded: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        // Simulate progress
        const interval = setInterval(() => {
          setProgress(prev => ({
            ...prev,
            [file.name]: Math.min((prev[file.name] || 0) + 10, 90)
          }));
        }, 200);

        const response = await fetch('/api/files', {
          method: 'POST',
          body: formData,
        });

        clearInterval(interval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }

        const result = await response.json();
        setProgress(prev => ({ ...prev, [file.name]: 100 }));
        uploaded.push(result);
      }

      setUploadedFiles(prev => [...prev, ...uploaded]);
      setFiles([]);
      setProgress({});

      if (onUploadComplete) {
        onUploadComplete(uploaded);
      }

    } catch (err: any) {
      setError(err.message);
      if (onUploadError) {
        onUploadError(err.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip')) return '📦';
    return '📎';
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag & drop files here or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="ml-2 text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'border-gray-300 hover:border-primary hover:bg-primary/5'
            )}
          >
            <input
              type="file"
              multiple={multiple}
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag & drop files here, or click to select files
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Max file size: {formatFileSize(maxSize)} • Supported: {acceptedTypes.join(', ')}
              </p>
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold">Files to Upload</h3>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {progress[file.name] !== undefined && (
                      <div className="w-24">
                        <Progress value={progress[file.name]} className="h-2" />
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFiles([])}
                  disabled={uploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={uploading || files.length === 0}
                >
                  {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold">Uploaded Files</h3>
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getFileIcon(file.fileType)}</span>
                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
