'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check, Camera, Video, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, ProgressBar, StepIndicator } from '@kealee/ui';
import { api } from '@/lib/api';

const STEPS = [
  { id: 'basics', title: 'Project Basics', subtitle: 'Name and location' },
  { id: 'scope', title: 'Project Scope', subtitle: 'Timeline and budget' },
  { id: 'media', title: 'Photos & Video', subtitle: 'Capture your site' },
  { id: 'contractors', title: 'Contractors', subtitle: 'Find or invite' },
  { id: 'review', title: 'Review', subtitle: 'Confirm and create' },
];

// Generic photo zones — swap to site-specific when type is New Build
const DEFAULT_ZONES = [
  { id: 'overall', label: 'Overall / Existing Condition', required: true, hint: 'Wide shot showing the main area to be worked on' },
  { id: 'problem_area', label: 'Problem Area / Focus Zone', required: true, hint: 'The specific area or issue you want to address' },
  { id: 'context', label: 'Surrounding Context', required: false, hint: 'Adjacent spaces or features that affect the project' },
];

const NEW_BUILD_ZONES = [
  { id: 'site_overview', label: 'Site Overview', required: true, hint: 'Full lot from the street or access road' },
  { id: 'lot_boundaries', label: 'Lot Boundaries', required: true, hint: 'Walk the perimeter and capture boundary markers' },
  { id: 'adjacent_structures', label: 'Adjacent Structures', required: false, hint: 'Neighboring homes or structures that affect design' },
];

interface PhotoZone { id: string; label: string; required: boolean; hint: string }
interface ZonePhoto { zoneId: string; file: File; url: string }

interface ProjectFormData {
  name: string;
  location: string;
  type: string;
  budget: string;
  startDate: string;
  endDate: string;
  description: string;
  contractorChoice: string;
  includeCTCEstimate: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    location: '',
    type: '',
    budget: '',
    startDate: '',
    endDate: '',
    description: '',
    contractorChoice: '',
    includeCTCEstimate: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Media state
  const [zonePhotos, setZonePhotos] = useState<ZonePhoto[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);

  const zones: PhotoZone[] = formData.type === 'New Build' ? NEW_BUILD_ZONES : DEFAULT_ZONES;
  const capturedZoneIds = new Set(zonePhotos.map(p => p.zoneId));

  // Auto-save every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (formData.name || formData.location) {
        saveDraft();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [formData]);

  const saveDraft = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/projects/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch {
      // Silently fail draft save
    } finally {
      setIsSaving(false);
    }
  };

  const handleZoneCapture = (zoneId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setZonePhotos(prev => {
      const without = prev.filter(p => p.zoneId !== zoneId);
      return [...without, { zoneId, file, url }];
    });
  };

  const handleVideoCapture = (file: File) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    const vid = document.createElement('video');
    vid.src = url;
    vid.onloadedmetadata = () => {
      const secs = Math.round(vid.duration);
      const mins = Math.floor(secs / 60);
      const remainder = secs % 60;
      setVideoDuration(`${mins}:${remainder.toString().padStart(2, '0')}`);
    };
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'Project name is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const createProject = async () => {
    if (!validateCurrentStep()) return;

    try {
      const mediaPayload = {
        mediaZones: zonePhotos.map(p => ({ zoneId: p.zoneId, filename: p.file.name })),
        hasVideoWalkthrough: !!videoFile,
      };

      if (formData.includeCTCEstimate) {
        const result = await api.createProjectWizard({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          location: formData.location,
          budget: formData.budget,
          includeCTCEstimate: true,
          createBidRequest: formData.contractorChoice === 'help',
          ...mediaPayload,
        });
        const projectId = result.project?.id;
        router.push(projectId ? `/projects/${projectId}` : '/projects/success');
      } else {
        const result = await api.createProject({
          name: formData.name,
          description: formData.description,
          category: (formData.type?.toUpperCase().replace(/\s+/g, '_') || 'OTHER') as any,
          ...mediaPayload,
        });
        const projectId = result.project?.id;
        router.push(projectId ? `/projects/${projectId}` : '/projects/success');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create project. Please try again.' });
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        {/* Progress Indicator */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* Progress Bar */}
        <div className="mt-6">
          <ProgressBar value={progress} showLabel variant="success" />
        </div>

        {/* Main Form Card */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          {currentStep === 0 && (
            <StepBasics formData={formData} setFormData={setFormData} errors={errors} />
          )}
          {currentStep === 1 && (
            <StepScope formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 2 && (
            <StepMedia
              zones={zones}
              zonePhotos={zonePhotos}
              capturedZoneIds={capturedZoneIds}
              videoFile={videoFile}
              videoUrl={videoUrl}
              videoDuration={videoDuration}
              onZoneCapture={handleZoneCapture}
              onRemoveZone={(zoneId) => setZonePhotos(prev => prev.filter(p => p.zoneId !== zoneId))}
              onVideoCapture={handleVideoCapture}
              onRemoveVideo={() => { setVideoFile(null); setVideoUrl(null); setVideoDuration(null); }}
            />
          )}
          {currentStep === 3 && (
            <StepContractors formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 4 && (
            <StepReview formData={formData} zonePhotos={zonePhotos} zones={zones} videoFile={videoFile} videoDuration={videoDuration} />
          )}

          {/* Error message */}
          {errors.submit && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              leftIcon={<ArrowLeft size={20} />}
            >
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                variant="primary"
                onClick={nextStep}
                rightIcon={<ArrowRight size={20} />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={createProject}
                leftIcon={<Check size={20} />}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Project
              </Button>
            )}
          </div>
        </div>

        {/* Auto-save indicator */}
        <div className="mt-4 text-center">
          {isSaving ? (
            <p className="text-sm text-gray-500">Saving...</p>
          ) : lastSaved ? (
            <p className="text-sm text-gray-500">
              Changes saved automatically{' '}
              {lastSaved.toLocaleTimeString()}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Changes will be saved automatically
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// STEP 1: BASICS
function StepBasics({
  formData,
  setFormData,
  errors,
}: {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  errors: Record<string, string>;
}) {
  const projectTypes = ['Renovation', 'New Build', 'Addition', 'Remodel'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Let's start with the basics
        </h2>
        <p className="text-gray-600">
          Give your project a name and tell us where it's located
        </p>
      </div>

      <Input
        label="Project Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Kitchen Renovation"
        error={errors.name}
        autoFocus
      />

      <Input
        label="Project Location"
        required
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        placeholder="Enter address..."
        error={errors.location}
        helperText="Start typing to see suggestions"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Project Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {projectTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, type })}
              className={`
                px-4 py-3
                border-2 rounded-lg
                font-medium
                transition-all duration-200
                ${
                  formData.type === type
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }
              `}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// STEP 2: SCOPE
function StepScope({
  formData,
  setFormData,
}: {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
}) {
  const budgetRanges = [
    '$10K - $50K',
    '$50K - $100K',
    '$100K - $250K',
    '$250K - $500K',
    '$500K+',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Project scope and timeline
        </h2>
        <p className="text-gray-600">
          Help us understand the size and duration of your project
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Budget Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          {budgetRanges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setFormData({ ...formData, budget: range })}
              className={`
                px-4 py-3
                border-2 rounded-lg
                font-medium
                transition-all duration-200
                ${
                  formData.budget === range
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        />
        <Input
          label="End Date (Expected)"
          type="date"
          value={formData.endDate}
          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        />
      </div>

      <Textarea
        label="Brief Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Tell us more about your project..."
        rows={3}
        helperText="Optional - You can add more details later"
      />

      <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.includeCTCEstimate}
            onChange={(e) =>
              setFormData({ ...formData, includeCTCEstimate: e.target.checked })
            }
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
          />
          <div>
            <p className="font-semibold text-amber-900">
              Include AI-powered CTC estimate
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Automatically generate a cost estimate using the Construction Task
              Catalog based on your project description and scope.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

// STEP 3: MEDIA
function StepMedia({
  zones,
  zonePhotos,
  capturedZoneIds,
  videoFile,
  videoUrl,
  videoDuration,
  onZoneCapture,
  onRemoveZone,
  onVideoCapture,
  onRemoveVideo,
}: {
  zones: PhotoZone[];
  zonePhotos: ZonePhoto[];
  capturedZoneIds: Set<string>;
  videoFile: File | null;
  videoUrl: string | null;
  videoDuration: string | null;
  onZoneCapture: (zoneId: string, file: File) => void;
  onRemoveZone: (zoneId: string) => void;
  onVideoCapture: (file: File) => void;
  onRemoveVideo: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Photos & Video
        </h2>
        <p className="text-gray-600">
          Capture your site so our AI can produce the best results. You can skip this and add media later.
        </p>
      </div>

      {/* Zone photo cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {zones.map(zone => {
          const captured = zonePhotos.find(p => p.zoneId === zone.id);
          return (
            <div
              key={zone.id}
              className="overflow-hidden rounded-xl border-2 transition-all"
              style={{
                borderColor: captured ? '#16a34a' : zone.required ? '#fca5a5' : '#e5e7eb',
              }}
            >
              {captured ? (
                <div className="relative aspect-video">
                  <img src={captured.url} alt={zone.label} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        Captured
                      </span>
                      <button
                        onClick={() => onRemoveZone(zone.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="rounded bg-black/50 px-2 py-0.5 text-xs text-white">{zone.label}</p>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 p-4 text-center">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/heic,image/*"
                    capture="environment"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) onZoneCapture(zone.id, file);
                      e.target.value = '';
                    }}
                  />
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: zone.required ? '#fee2e2' : '#f0fdf4' }}
                  >
                    <Camera size={20} style={{ color: zone.required ? '#dc2626' : '#16a34a' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {zone.label}
                      {zone.required && <span className="ml-1 text-red-500">*</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{zone.hint}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    Tap to capture
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* Video section */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Video size={18} className="text-gray-500" />
          <p className="font-semibold text-gray-800">Video Walkthrough</p>
          <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">Optional</span>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          A 2–3 min walkthrough dramatically improves AI deliverable quality
        </p>

        {videoUrl ? (
          <div>
            <video src={videoUrl} className="w-full rounded-lg" controls style={{ maxHeight: 220 }} />
            <div className="mt-2 flex items-center justify-between">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Video ready {videoDuration ? `· ${videoDuration}` : ''}
              </span>
              <button onClick={onRemoveVideo} className="text-xs text-red-500 hover:text-red-700">
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:bg-white">
              <input
                type="file"
                className="hidden"
                accept="video/*"
                capture="environment"
                onChange={e => { const f = e.target.files?.[0]; if (f) onVideoCapture(f); e.target.value = ''; }}
              />
              <Camera size={16} />
              Record
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:bg-white">
              <input
                type="file"
                className="hidden"
                accept="video/mp4,video/mov,video/quicktime,video/x-msvideo"
                onChange={e => { const f = e.target.files?.[0]; if (f) onVideoCapture(f); e.target.value = ''; }}
              />
              <Upload size={16} />
              Upload
            </label>
          </div>
        )}
      </div>

      {/* Skip note */}
      <p className="text-center text-sm text-gray-400">
        You can add photos and video later from your project dashboard
      </p>
    </div>
  );
}

// STEP 4: CONTRACTORS
function StepContractors({
  formData,
  setFormData,
}: {
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          How will you find contractors?
        </h2>
        <p className="text-gray-600">
          Choose how you want to manage contractors for this project
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, contractorChoice: 'own' })}
          className={`
            p-6 border-2 rounded-xl text-left transition-all duration-200
            ${formData.contractorChoice === 'own' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${formData.contractorChoice === 'own' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            👤
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">I'll find contractors</h3>
          <p className="text-gray-600">You already have contractors or want to find them yourself</p>
        </button>

        <button
          type="button"
          onClick={() => setFormData({ ...formData, contractorChoice: 'help' })}
          className={`
            p-6 border-2 rounded-xl text-left transition-all duration-200
            ${formData.contractorChoice === 'help' ? 'border-primary-600 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${formData.contractorChoice === 'help' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            🤝
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Help me find contractors</h3>
          <p className="text-gray-600">We'll suggest qualified contractors from our network</p>
        </button>
      </div>
    </div>
  );
}

// STEP 5: REVIEW
function StepReview({
  formData,
  zonePhotos,
  zones,
  videoFile,
  videoDuration,
}: {
  formData: ProjectFormData;
  zonePhotos: ZonePhoto[];
  zones: PhotoZone[];
  videoFile: File | null;
  videoDuration: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review your project</h2>
        <p className="text-gray-600">Make sure everything looks correct before creating</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500 mb-1">Project Name</p>
            <p className="text-lg font-semibold text-gray-900">{formData.name}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500 mb-1">Location</p>
          <p className="font-medium text-gray-900">{formData.location}</p>
        </div>

        <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Project Type</p>
            <p className="font-medium text-gray-900">{formData.type || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Budget Range</p>
            <p className="font-medium text-gray-900">{formData.budget || 'Not specified'}</p>
          </div>
        </div>

        {(formData.startDate || formData.endDate) && (
          <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Start Date</p>
              <p className="font-medium text-gray-900">{formData.startDate || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">End Date</p>
              <p className="font-medium text-gray-900">{formData.endDate || 'Not specified'}</p>
            </div>
          </div>
        )}

        {formData.description && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-900">{formData.description}</p>
          </div>
        )}

        {/* Media summary */}
        {(zonePhotos.length > 0 || videoFile) && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-2">Media Captured</p>
            {zonePhotos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {zonePhotos.map(p => {
                  const zone = zones.find(z => z.id === p.zoneId);
                  return (
                    <div key={p.zoneId} className="text-center">
                      <div className="h-14 w-14 overflow-hidden rounded-lg">
                        <img src={p.url} alt={zone?.label ?? p.zoneId} className="h-full w-full object-cover" />
                      </div>
                      <p className="mt-0.5 w-14 truncate text-[10px] text-gray-500">{zone?.label ?? p.zoneId}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {videoFile && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <Video size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">
                  Video walkthrough {videoDuration ? `· ${videoDuration}` : '· ready'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {formData.includeCTCEstimate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold">
            AI
          </div>
          <div>
            <p className="font-semibold text-amber-900">CTC Estimate Included</p>
            <p className="text-sm text-amber-700">
              An AI-powered cost estimate will be generated from the Construction Task Catalog
            </p>
          </div>
        </div>
      )}

      <div className="bg-primary-50 rounded-xl p-6">
        <h3 className="font-semibold text-primary-900 mb-3">What happens next?</h3>
        <ul className="space-y-2 text-sm text-primary-800">
          <li className="flex items-center gap-2">
            <Check size={16} className="text-primary-600" />
            Your project will be created and saved to your dashboard
          </li>
          {formData.includeCTCEstimate && (
            <li className="flex items-center gap-2">
              <Check size={16} className="text-primary-600" />
              A CTC-based cost estimate will be generated automatically
            </li>
          )}
          <li className="flex items-center gap-2">
            <Check size={16} className="text-primary-600" />
            You'll be able to invite contractors immediately
          </li>
          <li className="flex items-center gap-2">
            <Check size={16} className="text-primary-600" />
            Start tracking milestones and approving payments
          </li>
        </ul>
      </div>
    </div>
  );
}
