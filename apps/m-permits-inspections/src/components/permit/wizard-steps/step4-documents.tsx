// ============================================================
// WIZARD STEP 4: DOCUMENTS
// ============================================================

'use client';

import { UseFormReturn } from 'react-hook-form';
import { WizardFormData } from '../application-wizard';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Eye, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DocumentPreview } from '@/components/documents/document-preview';
import { createClient } from '@/lib/supabase/client';
import { documentChecklistService, RequiredDocument } from '@/services/permit-application/document-checklist';

interface Step4DocumentsProps {
  form: UseFormReturn<WizardFormData>;
}

export function Step4Documents({ form }: Step4DocumentsProps) {
  const { watch, setValue } = form;
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Map<string, string>>(new Map());
  const supabase = createClient();

  const permitType = watch('permitType');
  const valuation = watch('valuation');
  const squareFootage = watch('squareFootage');
  const plans = watch('plans') || [];
  const calculations = watch('calculations') || [];
  const reports = watch('reports') || [];

  // Load required documents based on permit type
  useEffect(() => {
    if (permitType) {
      const documents = documentChecklistService.getRequiredDocuments(permitType, {
        valuation,
        squareFootage,
      });
      setRequiredDocuments(documents);
    }
  }, [permitType, valuation, squareFootage]);

  const checklistStatus = documentChecklistService.getChecklistStatus(requiredDocuments);

  const handleFileUpload = async (
    file: File,
    document: RequiredDocument
  ) => {
    // Validate file
    const validation = documentChecklistService.validateFile(file, document);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(document.id);
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `permits/${document.type}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update document status
      const updated = requiredDocuments.map(doc =>
        doc.id === document.id
          ? {...doc, uploaded: true, fileId: urlData.publicUrl, fileName: file.name}
          : doc
      );
      setRequiredDocuments(updated);
      setUploadedDocuments(new Map(uploadedDocuments.set(document.id, urlData.publicUrl)));

      // Also update form data for backward compatibility
      const category = getCategoryForDocumentType(document.type);
      if (category) {
        const currentFiles = watch(category) || [];
        setValue(category, [...currentFiles, urlData.publicUrl]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const getCategoryForDocumentType = (type: string): 'plans' | 'calculations' | 'reports' | null => {
    if (['SITE_PLAN', 'FLOOR_PLAN', 'ELEVATION'].includes(type)) return 'plans';
    if (['STRUCTURAL_CALCS', 'ELECTRICAL_DIAGRAM', 'PLUMBING_DIAGRAM', 'MECHANICAL_DIAGRAM', 'ENERGY_CALC'].includes(type)) return 'calculations';
    if (['SOILS_REPORT', 'SURVEY', 'PHOTOS', 'CONTRACTOR_LICENSE', 'INSURANCE'].includes(type)) return 'reports';
    return null;
  };

  const handleRemoveFile = (
    url: string,
    category: 'plans' | 'calculations' | 'reports'
  ) => {
    const currentFiles = watch(category) || [];
    setValue(
      category,
      currentFiles.filter((f: string) => f !== url)
    );
  };

  const FileUploadSection = ({
    title,
    category,
    files,
  }: {
    title: string;
    category: 'plans' | 'calculations' | 'reports';
    files: string[];
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{title}</Label>
        <span className="text-sm text-gray-500">{files.length} file(s)</span>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <input
          type="file"
          id={`upload-${category}`}
          className="hidden"
          accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
          multiple
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || []);
            selectedFiles.forEach((file) => handleFileUpload(file, category));
          }}
        />
        <label
          htmlFor={`upload-${category}`}
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-1">
            PDF, DWG, DXF, JPG, PNG (Max 50MB)
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((url, index) => {
            const fileName = url.split('/').pop() || `File ${index + 1}`;
            return (
              <div
                key={url}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700 truncate max-w-xs">
                    {fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewUrl(url)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(url, category)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {uploading === category && (
        <div className="text-sm text-blue-600">Uploading...</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Required Documents</h2>
        <p className="text-gray-600">
          Upload all required documents for your permit application
        </p>
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{checklistStatus.completed} of {checklistStatus.required} required uploaded</span>
          </div>
          {checklistStatus.optional > 0 && (
            <div className="flex items-center gap-2 text-gray-500">
              <span>{checklistStatus.optional} optional documents</span>
            </div>
          )}
        </div>
      </div>

      {/* Required Documents Checklist */}
      <div className="space-y-4">
        {requiredDocuments.map((document) => (
          <Card
            key={document.id}
            className={`p-4 ${document.uploaded ? 'bg-green-50 border-green-200' : document.required ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label className="font-semibold">{document.name}</Label>
                  {document.required && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                  {document.uploaded && (
                    <Badge variant="default" className="bg-green-600 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                {document.guidance && (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                    <HelpCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{document.guidance}</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Accepted: {document.fileTypes.join(', ').toUpperCase()} • Max: {document.maxSize}MB
                </div>
              </div>
            </div>

            {!document.uploaded ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  id={`upload-${document.id}`}
                  className="hidden"
                  accept={document.fileTypes.map(ext => `.${ext}`).join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file, document);
                    }
                  }}
                />
                <label
                  htmlFor={`upload-${document.id}`}
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-6 w-6 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload {document.name}
                  </p>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">{document.fileName || 'Uploaded file'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewUrl(uploadedDocuments.get(document.id) || null)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const updated = requiredDocuments.map(doc =>
                        doc.id === document.id
                          ? {...doc, uploaded: false, fileId: undefined, fileName: undefined}
                          : doc
                      );
                      setRequiredDocuments(updated);
                      const newMap = new Map(uploadedDocuments);
                      newMap.delete(document.id);
                      setUploadedDocuments(newMap);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {uploading === document.id && (
              <div className="mt-2 text-sm text-blue-600">Uploading...</div>
            )}

            {document.exampleUrl && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => window.open(document.exampleUrl, '_blank')}
              >
                View Example
              </Button>
            )}
          </Card>
        ))}
      </div>

      {previewUrl && (
        <DocumentPreview
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  );
}
