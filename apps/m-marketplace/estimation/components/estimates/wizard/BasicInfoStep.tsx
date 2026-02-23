'use client';

import { useState } from 'react';
import { Button } from '@estimation/components/ui/button';
import { Input } from '@estimation/components/ui/input';
import { Label } from '@estimation/components/ui/label';
import { Textarea } from '@estimation/components/ui/textarea';

interface BasicInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
}

const projectTypes = [
  { value: 'residential-new', label: 'Residential New Construction' },
  { value: 'residential-remodel', label: 'Residential Remodel' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'other', label: 'Other' },
];

export function BasicInfoStep({
  data,
  onNext,
  onBack,
  isFirst,
}: BasicInfoStepProps) {
  const [formData, setFormData] = useState(
    data.basicInfo || {
      projectName: '',
      clientName: '',
      projectType: '',
      location: '',
      description: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.projectName?.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    if (!formData.projectType) {
      newErrors.projectType = 'Project type is required';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Project description is required for AI analysis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext({ basicInfo: formData });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Basic Information</h2>
        <p className="text-muted-foreground mt-1">
          Tell us about your project to get started
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="projectName">
            Project Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="projectName"
            value={formData.projectName}
            onChange={(e) => {
              setFormData({ ...formData, projectName: e.target.value });
              setErrors({ ...errors, projectName: '' });
            }}
            placeholder="e.g., Residential Addition"
            className={errors.projectName ? 'border-destructive' : ''}
          />
          {errors.projectName && (
            <p className="text-sm text-destructive mt-1">{errors.projectName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="clientName">Client Name</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) =>
              setFormData({ ...formData, clientName: e.target.value })
            }
            placeholder="John Doe or ABC Construction"
          />
        </div>

        <div>
          <Label htmlFor="projectType">
            Project Type <span className="text-destructive">*</span>
          </Label>
          <select
            id="projectType"
            value={formData.projectType}
            onChange={(e) => {
              setFormData({ ...formData, projectType: e.target.value });
              setErrors({ ...errors, projectType: '' });
            }}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              errors.projectType ? 'border-destructive' : ''
            }`}
          >
            <option value="">Select project type...</option>
            {projectTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.projectType && (
            <p className="text-sm text-destructive mt-1">{errors.projectType}</p>
          )}
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="City, State"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used for regional cost adjustments
          </p>
        </div>

        <div>
          <Label htmlFor="description">
            Project Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              setErrors({ ...errors, description: '' });
            }}
            placeholder="Describe the scope of work in detail. Include square footage, number of rooms, materials, finishes, etc. The more detail you provide, the better our AI can analyze the project."
            rows={6}
            className={errors.description ? 'border-destructive' : ''}
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            💡 AI will analyze your description to suggest line items and assemblies
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isFirst}>
          Back
        </Button>
        <Button onClick={handleSubmit}>Next: AI Scope Analysis</Button>
      </div>
    </div>
  );
}
