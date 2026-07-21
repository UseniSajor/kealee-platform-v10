// ============================================================
// PERMIT DOCUMENTS
// Document management interface
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, File, Eye, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DocumentPreview } from '@/components/documents/document-preview';

interface PermitDocumentsProps {
  permitId: string;
}

export function PermitDocuments({ permitId }: PermitDocumentsProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const supabase = createClient();

  const { data: permit } = useQuery({
    queryKey: ['permit', permitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Permit')
        .select('plans, calculations, reports, otherDocuments')
        .eq('id', permitId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const allDocuments = [
    ...(permit?.plans || []).map((url: string) => ({ url, category: 'Plans', type: 'plan' })),
    ...(permit?.calculations || []).map((url: string) => ({ url, category: 'Calculations', type: 'calculation' })),
    ...(permit?.reports || []).map((url: string) => ({ url, category: 'Reports', type: 'report' })),
    ...(permit?.otherDocuments || []).map((url: string) => ({ url, category: 'Other', type: 'other' })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Documents</h2>
          <p className="text-sm text-gray-500">View and manage permit documents</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {allDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allDocuments.map((doc: any, index: number) => {
            const fileName = doc.url.split('/').pop() || `Document ${index + 1}`;
            return (
              <Card key={doc.url}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium truncate max-w-xs">{fileName}</p>
                        <p className="text-xs text-gray-500">{doc.category}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewUrl(doc.url)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} download>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No documents uploaded yet</p>
          </CardContent>
        </Card>
      )}

      {previewUrl && (
        <DocumentPreview url={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}
    </div>
  );
}
