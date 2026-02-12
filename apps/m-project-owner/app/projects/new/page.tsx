'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, ProgressBar, StepIndicator } from '@kealee/ui';

const STEPS = [
  { id: 'basics', title: 'Project Basics', subtitle: 'Name and location' },
  { id: 'scope', title: 'Project Scope', subtitle: 'Timeline and budget' },
  { id: 'contractors', title: 'Contractors', subtitle: 'Find or invite' },
  { id: 'review', title: 'Review', subtitle: 'Confirm and create' },
];

interface ProjectFormData {
  name: string;
  location: string;
  type: string;
  budget: string;
  startDate: string;
  endDate: string;
  description: string;
  contractorChoice: string;
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save draft');
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
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
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create project');
      }

      const data = await response.json();
      const projectId = data.project?.id;
      router.push(projectId ? `/projects/${projectId}` : '/projects/success');
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
          {/* Step Content */}
          {currentStep === 0 && (
            <StepBasics formData={formData} setFormData={setFormData} errors={errors} />
          )}
          {currentStep === 1 && (
            <StepScope formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 2 && (
            <StepContractors formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 3 && <StepReview formData={formData} />}

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
            <p className="text-sm text-gray-500">💾 Saving...</p>
          ) : lastSaved ? (
            <p className="text-sm text-gray-500">
              💾 Changes saved automatically{' '}
              {lastSaved.toLocaleTimeString()}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              💾 Changes will be saved automatically
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

      {/* Project Name */}
      <Input
        label="Project Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Kitchen Renovation"
        error={errors.name}
        autoFocus
      />

      {/* Location with Autocomplete */}
      <Input
        label="Project Location"
        required
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        placeholder="Enter address..."
        error={errors.location}
        helperText="Start typing to see suggestions"
      />

      {/* Project Type */}
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

      {/* Budget Range */}
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

      {/* Timeline */}
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

      {/* Description - Optional */}
      <Textarea
        label="Brief Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Tell us more about your project..."
        rows={3}
        helperText="Optional - You can add more details later"
      />
    </div>
  );
}

// STEP 3: CONTRACTORS
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
        {/* Option 1 */}
        <button
          type="button"
          onClick={() => setFormData({ ...formData, contractorChoice: 'own' })}
          className={`
            p-6
            border-2 rounded-xl
            text-left
            transition-all duration-200
            ${
              formData.contractorChoice === 'own'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <div
            className={`
              w-12 h-12 rounded-full mb-4
              flex items-center justify-center
              ${
                formData.contractorChoice === 'own'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }
            `}
          >
            👤
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            I'll find contractors
          </h3>
          <p className="text-gray-600">
            You already have contractors or want to find them yourself
          </p>
        </button>

        {/* Option 2 */}
        <button
          type="button"
          onClick={() => setFormData({ ...formData, contractorChoice: 'help' })}
          className={`
            p-6
            border-2 rounded-xl
            text-left
            transition-all duration-200
            ${
              formData.contractorChoice === 'help'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <div
            className={`
              w-12 h-12 rounded-full mb-4
              flex items-center justify-center
              ${
                formData.contractorChoice === 'help'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }
            `}
          >
            🤝
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Help me find contractors
          </h3>
          <p className="text-gray-600">
            We'll suggest qualified contractors from our network
          </p>
        </button>
      </div>
    </div>
  );
}

// STEP 4: REVIEW
function StepReview({ formData }: { formData: ProjectFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review your project
        </h2>
        <p className="text-gray-600">
          Make sure everything looks correct before creating
        </p>
      </div>

      {/* Summary Card */}
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
              <p className="font-medium text-gray-900">
                {formData.startDate || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">End Date</p>
              <p className="font-medium text-gray-900">
                {formData.endDate || 'Not specified'}
              </p>
            </div>
          </div>
        )}

        {formData.description && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-900">{formData.description}</p>
          </div>
        )}
      </div>

      {/* Next Steps Preview */}
      <div className="bg-primary-50 rounded-xl p-6">
        <h3 className="font-semibold text-primary-900 mb-3">What happens next?</h3>
        <ul className="space-y-2 text-sm text-primary-800">
          <li className="flex items-center gap-2">
            <Check size={16} className="text-primary-600" />
            Your project will be created and saved to your dashboard
          </li>
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
