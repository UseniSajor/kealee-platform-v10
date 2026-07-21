// ============================================================
// INSPECTION REQUEST FORM
// Request inspection with checklist and photo upload
// ============================================================

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload, X, Camera } from 'lucide-react';

const inspectionSchema = z.object({
  permitId: z.string().min(1, 'Permit is required'),
  inspectionType: z.string().min(1, 'Inspection type is required'),
  description: z.string().optional(),
  phaseRequired: z.string().optional(),
  requestedDate: z.string().min(1, 'Requested date is required'),
  notes: z.string().optional(),
  sitePhotos: z.array(z.string()).optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

const INSPECTION_TYPES = [
  { value: 'SITE', label: 'Site Inspection' },
  { value: 'FOOTING', label: 'Footing' },
  { value: 'FOUNDATION', label: 'Foundation' },
  { value: 'SLAB', label: 'Slab' },
  { value: 'ROUGH_FRAMING', label: 'Rough Framing' },
  { value: 'ROUGH_ELECTRICAL', label: 'Rough Electrical' },
  { value: 'ROUGH_PLUMBING', label: 'Rough Plumbing' },
  { value: 'ROUGH_MECHANICAL', label: 'Rough Mechanical' },
  { value: 'INSULATION', label: 'Insulation' },
  { value: 'GYPSUM_BOARD', label: 'Gypsum Board' },
  { value: 'FINAL_ELECTRICAL', label: 'Final Electrical' },
  { value: 'FINAL_PLUMBING', label: 'Final Plumbing' },
  { value: 'FINAL_MECHANICAL', label: 'Final Mechanical' },
  { value: 'FINAL_BUILDING', label: 'Final Building' },
  { value: 'FINAL_FIRE', label: 'Final Fire' },
  { value: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of Occupancy' },
];

interface InspectionRequestFormProps {
  permitId?: string;
}

export function InspectionRequestForm({ permitId: initialPermitId }: InspectionRequestFormProps) {
  const [uploading, setUploading] = useState(false);
  const [sitePhotos, setSitePhotos] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      permitId: initialPermitId || '',
      sitePhotos: [],
    },
  });

  // Fetch user's permits
  const { data: permits } = useQuery({
    queryKey: ['permits', 'user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('Permit')
        .select('id, permitNumber, permitType, scope')
        .eq('clientId', user.id)
        .in('kealeeStatus', ['APPROVED', 'ISSUED', 'ACTIVE'])
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `inspection-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `inspections/photos/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setSitePhotos((prev) => [...prev, urlData.publicUrl]);
      form.setValue('sitePhotos', [...sitePhotos, urlData.publicUrl]);
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = (url: string) => {
    const updated = sitePhotos.filter((p) => p !== url);
    setSitePhotos(updated);
    form.setValue('sitePhotos', updated);
  };

  const onSubmit = async (data: InspectionFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('Inspection').insert({
        permitId: data.permitId,
        projectId: '', // Would get from permit
        inspectionType: data.inspectionType,
        description: data.description,
        phaseRequired: data.phaseRequired,
        requestedDate: new Date(data.requestedDate),
        requestedBy: user.id,
        sitePhotos: sitePhotos,
        notes: data.notes,
        readyToSchedule: true,
      });

      if (error) throw error;

      router.push('/dashboard/inspections');
    } catch (error) {
      console.error('Inspection request error:', error);
      alert('Failed to request inspection');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Inspection</CardTitle>
        <CardDescription>
          Schedule an inspection for your permit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="permitId">Permit *</Label>
            <Select
              value={form.watch('permitId')}
              onValueChange={(value) => form.setValue('permitId', value)}
              disabled={!!initialPermitId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select permit" />
              </SelectTrigger>
              <SelectContent>
                {permits?.map((permit: any) => (
                  <SelectItem key={permit.id} value={permit.id}>
                    {permit.permitNumber || 'Draft'} - {permit.permitType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.permitId && (
              <p className="text-sm text-red-600">
                {form.formState.errors.permitId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspectionType">Inspection Type *</Label>
            <Select
              value={form.watch('inspectionType')}
              onValueChange={(value) => form.setValue('inspectionType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select inspection type" />
              </SelectTrigger>
              <SelectContent>
                {INSPECTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.inspectionType && (
              <p className="text-sm text-red-600">
                {form.formState.errors.inspectionType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestedDate">Preferred Date *</Label>
            <Input
              id="requestedDate"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...form.register('requestedDate')}
            />
            {form.formState.errors.requestedDate && (
              <p className="text-sm text-red-600">
                {form.formState.errors.requestedDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Additional details about the inspection..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Pre-Inspection Photos</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach((file) => handlePhotoUpload(file));
                }}
              />
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload photos or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG (Max 10MB each)
                </p>
              </label>
            </div>

            {sitePhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-4 mt-4">
                {sitePhotos.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Inspector</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Any special instructions or site access information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Request Inspection'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
