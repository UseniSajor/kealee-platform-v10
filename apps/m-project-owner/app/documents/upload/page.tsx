'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, X, CheckCircle, FileText, Image, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { uploadFileToS3, type UploadResponse } from '../../../lib/s3-upload';
import { apiRequest, type ProjectSummary } from '../../../lib/api';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
  file: File;
  uploadResult?: UploadResponse;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DocumentUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const uploadingRef = useRef(new Set<string>());

  const categories = [
    'Contracts & Agreements',
    'Permits & Approvals',
    'Plans & Drawings',
    'Photos',
    'Invoices & Receipts',
    'Correspondence',
    'Other',
  ];

  // Fetch user's projects on mount
  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await apiRequest<{ projects: ProjectSummary[] }>('/projects');
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return Image;
    if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

  const processFiles = (newFiles: File[]) => {
    const uploadFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
      file,
    }));

    setFiles(prev => [...prev, ...uploadFiles]);

    // Upload each file to S3/R2
    uploadFiles.forEach(uf => {
      if (uploadingRef.current.has(uf.id)) return;
      uploadingRef.current.add(uf.id);

      // Show initial progress
      setFiles(prev =>
        prev.map(f => f.id === uf.id ? { ...f, progress: 10 } : f)
      );

      uploadFileToS3(uf.file, {
        category: selectedCategory || 'Other',
        projectId: selectedProject || '',
      })
        .then(result => {
          setFiles(prev =>
            prev.map(f =>
              f.id === uf.id
                ? { ...f, status: 'complete' as const, progress: 100, uploadResult: result }
                : f
            )
          );
        })
        .catch(err => {
          setFiles(prev =>
            prev.map(f =>
              f.id === uf.id
                ? { ...f, status: 'error' as const, progress: 0, error: err.message }
                : f
            )
          );
        })
        .finally(() => {
          uploadingRef.current.delete(uf.id);
        });
    });
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const completedFiles = files.filter(f => f.status === 'complete');
  const hasErrors = files.some(f => f.status === 'error');

  // Save completed files to project via POST /files/complete
  const handleSave = async () => {
    if (!selectedProject || !selectedCategory) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const results = await Promise.all(
        completedFiles.map(f => {
          if (!f.uploadResult) return Promise.resolve(null);
          return apiRequest<{ file: unknown }>('/files/complete', {
            method: 'POST',
            body: {
              key: f.uploadResult.key,
              fileName: f.uploadResult.fileName,
              mimeType: f.uploadResult.mimeType,
              size: f.uploadResult.size,
              metadata: {
                projectId: selectedProject,
                category: selectedCategory,
              },
            },
          });
        })
      );

      const succeeded = results.filter(Boolean).length;
      if (succeeded === completedFiles.length) {
        setSaveSuccess(true);
        // Clear files after successful save
        setTimeout(() => {
          setFiles([]);
          setSaveSuccess(false);
        }, 2000);
      } else {
        setSaveError(`${succeeded}/${completedFiles.length} files saved. Some failed.`);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save documents');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Documents
          </h1>
          <p className="text-gray-600">
            Upload documents, photos, and files to your project
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Project & Category Selection */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={loadingProjects}
              >
                <option value="">
                  {loadingProjects ? 'Loading projects...' : 'Choose a project...'}
                </option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Choose a category...</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition
              ${dragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400'
              }
            `}
          >
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className={`mx-auto mb-4 ${dragActive ? 'text-indigo-600' : 'text-gray-400'}`} size={48} />
            <p className="text-lg font-medium text-gray-900 mb-1">
              {dragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-gray-500 mb-4">or click to browse</p>
            <p className="text-sm text-gray-400">
              PDF, DOC, XLS, JPG, PNG up to 50MB each
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  {completedFiles.length} of {files.length} files uploaded
                </h3>
                {completedFiles.length === files.length && files.length > 0 && !hasErrors && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle size={16} />
                    All complete
                  </span>
                )}
              </div>

              {files.map(file => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div
                    key={file.id}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      file.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <FileIcon className={file.status === 'error' ? 'text-red-500' : 'text-gray-500'} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      {file.status === 'uploading' && (
                        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                      {file.status === 'error' && (
                        <p className="text-sm text-red-600 mt-1">{file.error || 'Upload failed'}</p>
                      )}
                    </div>
                    {file.status === 'uploading' ? (
                      <Loader2 className="text-indigo-600 animate-spin" size={20} />
                    ) : file.status === 'complete' ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <AlertCircle className="text-red-500" size={20} />
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Error/Success Messages */}
          {saveError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Documents saved successfully!
            </div>
          )}

          {/* Submit Button */}
          {completedFiles.length > 0 && (
            <button
              onClick={handleSave}
              disabled={!selectedProject || !selectedCategory || saving}
              className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving...
                </>
              ) : (
                `Save ${completedFiles.length} Document${completedFiles.length > 1 ? 's' : ''} to Project`
              )}
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
