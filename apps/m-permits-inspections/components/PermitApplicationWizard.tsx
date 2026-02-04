// apps/m-permits-inspections/components/PermitApplicationWizard.tsx
// 5-Step Permit Application Wizard with React Hook Form + Zod

'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Zod Schemas for each step
const projectInfoSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  projectType: z.enum(['residential', 'commercial', 'mixed_use', 'industrial']),
  permitTypes: z.array(z.string()).min(1, 'Select at least one permit type'),
  estimatedValue: z.number().min(1, 'Project value is required'),
});

const propertyDetailsSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'Valid ZIP code required'),
  propertyType: z.enum(['single_family', 'multi_family', 'townhouse', 'condo', 'commercial', 'industrial']),
  jurisdiction: z.string().optional(),
});

const scopeOfWorkSchema = z.object({
  description: z.string().min(20, 'Description must be at least 20 characters'),
  squareFootage: z.number().min(1, 'Square footage is required'),
  stories: z.number().min(1).max(100),
  isHistoricDistrict: z.boolean(),
  workTypes: z.array(z.string()).min(1, 'Select at least one work type'),
});

const documentsSchema = z.object({
  uploadedFiles: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
  })),
});

const reviewSchema = z.object({
  packageType: z.enum(['diy', 'standard', 'premium', 'enterprise']),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
});

// Combined schema
const fullFormSchema = z.object({
  ...projectInfoSchema.shape,
  ...propertyDetailsSchema.shape,
  ...scopeOfWorkSchema.shape,
  ...documentsSchema.shape,
  ...reviewSchema.shape,
});

type FormData = z.infer<typeof fullFormSchema>;

const steps = [
  { id: 1, name: 'Project Info', description: 'Basic project details' },
  { id: 2, name: 'Property', description: 'Location & type' },
  { id: 3, name: 'Scope of Work', description: 'What you\'re building' },
  { id: 4, name: 'Documents', description: 'Upload required files' },
  { id: 5, name: 'Review & Pay', description: 'Confirm & submit' },
];

const permitTypeOptions = [
  { id: 'building', label: 'Building Permit', icon: '🏗️' },
  { id: 'electrical', label: 'Electrical Permit', icon: '⚡' },
  { id: 'plumbing', label: 'Plumbing Permit', icon: '🚰' },
  { id: 'mechanical', label: 'Mechanical/HVAC', icon: '❄️' },
  { id: 'demolition', label: 'Demolition Permit', icon: '🔨' },
  { id: 'grading', label: 'Grading Permit', icon: '🚜' },
];

const workTypeOptions = [
  'New Construction',
  'Addition',
  'Renovation/Alteration',
  'Repair',
  'Change of Use',
  'Tenant Improvement',
];

const packageOptions = [
  {
    id: 'diy',
    name: 'DIY',
    price: 495,
    description: 'AI review + self-service',
    features: ['AI application review', 'Smart form filling', 'Status tracking'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 1500,
    description: 'Most popular',
    popular: true,
    features: ['Everything in DIY', 'Permit specialist review', 'Corrections handling', 'Inspection scheduling'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 3500,
    description: 'Full service',
    features: ['Everything in Standard', 'Dedicated permit manager', 'Multi-permit coordination', 'Expediting'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 7500,
    description: 'High-volume',
    features: ['Everything in Premium', 'Volume discounts', 'Custom workflows', 'API access'],
  },
];

// Document checklist based on permit types (simplified)
const getRequiredDocuments = (permitTypes: string[]) => {
  const docs: { name: string; required: boolean; description: string }[] = [
    { name: 'Site Plan', required: true, description: 'Scaled drawing showing property boundaries' },
    { name: 'Floor Plans', required: true, description: 'Detailed floor layouts with dimensions' },
  ];

  if (permitTypes.includes('building')) {
    docs.push(
      { name: 'Structural Drawings', required: true, description: 'Foundation, framing, and load calculations' },
      { name: 'Elevation Drawings', required: true, description: 'Front, rear, and side views' }
    );
  }
  if (permitTypes.includes('electrical')) {
    docs.push(
      { name: 'Electrical Plans', required: true, description: 'Panel schedules and circuit layouts' },
      { name: 'Load Calculations', required: true, description: 'Electrical load analysis' }
    );
  }
  if (permitTypes.includes('plumbing')) {
    docs.push(
      { name: 'Plumbing Plans', required: true, description: 'Fixture locations and pipe sizing' }
    );
  }
  if (permitTypes.includes('mechanical')) {
    docs.push(
      { name: 'HVAC Plans', required: true, description: 'Equipment specs and duct layouts' },
      { name: 'Manual J Calculations', required: true, description: 'Heating/cooling load analysis' }
    );
  }

  return docs;
};

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  currentStep > step.id
                    ? 'bg-[#38A169] text-white'
                    : currentStep === step.id
                    ? 'bg-[#E8793A] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-[#4A90D9]' : 'text-gray-400'}`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 sm:mx-4 rounded ${
                  currentStep > step.id ? 'bg-[#38A169]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FileUploadZone({
  files,
  onFilesChange,
  requiredDocs,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  requiredDocs: { name: string; required: boolean; description: string }[];
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesChange([...files, ...droppedFiles]);
    },
    [files, onFilesChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        onFilesChange([...files, ...selectedFiles]);
      }
    },
    [files, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  return (
    <div className="space-y-6">
      {/* Checklist */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-[#4A90D9] mb-3">Required Documents</h4>
        <ul className="space-y-2">
          {requiredDocs.map((doc, index) => {
            const isUploaded = files.some(f =>
              f.name.toLowerCase().includes(doc.name.toLowerCase().replace(' ', ''))
            );
            return (
              <li key={index} className="flex items-start gap-3">
                <span className={`mt-0.5 ${isUploaded ? 'text-[#38A169]' : 'text-gray-300'}`}>
                  {isUploaded ? '✓' : '○'}
                </span>
                <div>
                  <p className={`font-medium ${isUploaded ? 'text-[#38A169]' : 'text-gray-700'}`}>
                    {doc.name} {doc.required && <span className="text-red-500">*</span>}
                  </p>
                  <p className="text-sm text-gray-500">{doc.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging
            ? 'border-[#E8793A] bg-[#E8793A]/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-gray-600 mb-2">Drag and drop files here, or</p>
        <label className="inline-block">
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
          />
          <span className="px-4 py-2 bg-[#E8793A] text-white font-medium rounded-lg cursor-pointer hover:bg-[#d16a2f] transition-colors">
            Browse Files
          </span>
        </label>
        <p className="text-sm text-gray-400 mt-3">PDF, DWG, DXF, JPG, PNG up to 50MB each</p>
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-[#4A90D9]">Uploaded Files ({files.length})</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[#4A90D9] text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmationScreen({ trackingNumber }: { trackingNumber: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12"
    >
      <div className="w-20 h-20 bg-[#38A169] rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-3xl font-bold text-[#4A90D9] mb-4">Application Submitted!</h2>
      <p className="text-xl text-gray-600 mb-8">Your permit application is now being processed.</p>

      <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto mb-8">
        <p className="text-sm text-gray-500 mb-2">Tracking Number</p>
        <p className="text-2xl font-mono font-bold text-[#4A90D9]">{trackingNumber}</p>
      </div>

      <div className="bg-[#E8793A]/10 border border-[#E8793A]/20 rounded-xl p-6 max-w-md mx-auto mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-[#E8793A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="font-semibold text-[#E8793A]">AI Review Starting</span>
        </div>
        <p className="text-sm text-gray-600">
          Our AI will review your application in approximately <strong>5 minutes</strong>.
          You'll receive an email with the results and any suggestions.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8793A] text-white font-semibold rounded-xl hover:bg-[#d16a2f] transition-colors"
        >
          Go to Dashboard
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
        <p className="text-sm text-gray-500">
          We've sent a confirmation email to your registered address.
        </p>
      </div>
    </motion.div>
  );
}

export function PermitApplicationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(fullFormSchema),
    defaultValues: {
      projectName: '',
      projectType: 'residential',
      permitTypes: [],
      estimatedValue: 0,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      propertyType: 'single_family',
      description: '',
      squareFootage: 0,
      stories: 1,
      isHistoricDistrict: false,
      workTypes: [],
      uploadedFiles: [],
      packageType: 'standard',
      agreeToTerms: false,
    },
    mode: 'onChange',
  });

  const watchPermitTypes = watch('permitTypes') || [];
  const watchPackageType = watch('packageType');
  const selectedPackage = packageOptions.find(p => p.id === watchPackageType);
  const requiredDocs = getRequiredDocuments(watchPermitTypes);

  const goToNextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['projectName', 'projectType', 'permitTypes', 'estimatedValue'];
        break;
      case 2:
        fieldsToValidate = ['address', 'city', 'state', 'zipCode', 'propertyType'];
        break;
      case 3:
        fieldsToValidate = ['description', 'squareFootage', 'stories', 'workTypes'];
        break;
      case 4:
        // Documents step - no required validation for now
        break;
      case 5:
        fieldsToValidate = ['packageType', 'agreeToTerms'];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid || currentStep === 4) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: FormData) => {
    // Simulate submission
    console.log('Form submitted:', data);

    // Generate tracking number
    const tracking = `PKL-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setTrackingNumber(tracking);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return <ConfirmationScreen trackingNumber={trackingNumber} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#4A90D9]">New Permit Application</h1>
          <p className="text-gray-600 mt-2">Complete all steps to submit your permit application</p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Project Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-[#4A90D9] mb-6">Project Information</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('projectName')}
                      type="text"
                      placeholder="e.g., Kitchen Renovation at 123 Main St"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                    />
                    {errors.projectName && (
                      <p className="text-red-500 text-sm mt-1">{errors.projectName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('projectType')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="mixed_use">Mixed Use</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Permit Types Needed <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="permitTypes"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-3">
                          {permitTypeOptions.map((option) => (
                            <label
                              key={option.id}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                field.value?.includes(option.id)
                                  ? 'border-[#E8793A] bg-[#E8793A]/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={field.value?.includes(option.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, option.id]);
                                  } else {
                                    field.onChange(field.value.filter((v: string) => v !== option.id));
                                  }
                                }}
                                className="hidden"
                              />
                              <span className="text-xl">{option.icon}</span>
                              <span className="font-medium text-[#4A90D9]">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {errors.permitTypes && (
                      <p className="text-red-500 text-sm mt-1">{errors.permitTypes.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Project Value <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        {...register('estimatedValue', { valueAsNumber: true })}
                        type="number"
                        placeholder="50000"
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                      />
                    </div>
                    {errors.estimatedValue && (
                      <p className="text-red-500 text-sm mt-1">{errors.estimatedValue.message}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Property Details */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-[#4A90D9] mb-6">Property Details</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('address')}
                      type="text"
                      placeholder="123 Main Street"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('city')}
                        type="text"
                        placeholder="Washington"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('state')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                      >
                        <option value="">Select state</option>
                        <option value="DC">District of Columbia</option>
                        <option value="MD">Maryland</option>
                        <option value="VA">Virginia</option>
                      </select>
                      {errors.state && (
                        <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('zipCode')}
                      type="text"
                      placeholder="20001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                    />
                    {errors.zipCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.zipCode.message}</p>
                    )}
                  </div>

                  {/* Auto-detected jurisdiction badge */}
                  <div className="bg-[#38A169]/10 border border-[#38A169]/20 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#38A169]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-[#38A169]">Jurisdiction Detected</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Based on your address, permits will be submitted to <strong>Washington, DC DCRA</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('propertyType')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                    >
                      <option value="single_family">Single Family Home</option>
                      <option value="multi_family">Multi-Family (2-4 units)</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="condo">Condo/Apartment</option>
                      <option value="commercial">Commercial Building</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Scope of Work */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-[#4A90D9] mb-6">Scope of Work</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      placeholder="Describe the work to be performed in detail..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Square Footage <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('squareFootage', { valueAsNumber: true })}
                        type="number"
                        placeholder="1500"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                      />
                      {errors.squareFootage && (
                        <p className="text-red-500 text-sm mt-1">{errors.squareFootage.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Stories <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('stories', { valueAsNumber: true })}
                        type="number"
                        min={1}
                        max={100}
                        placeholder="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8793A]/20 focus:border-[#E8793A]"
                      />
                      {errors.stories && (
                        <p className="text-red-500 text-sm mt-1">{errors.stories.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Type of Work <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="workTypes"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2">
                          {workTypeOptions.map((option) => (
                            <label
                              key={option}
                              className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                field.value?.includes(option)
                                  ? 'border-[#E8793A] bg-[#E8793A]/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={field.value?.includes(option)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, option]);
                                  } else {
                                    field.onChange(field.value.filter((v: string) => v !== option));
                                  }
                                }}
                                className="hidden"
                              />
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  field.value?.includes(option)
                                    ? 'bg-[#E8793A] border-[#E8793A]'
                                    : 'border-gray-300'
                                }`}
                              >
                                {field.value?.includes(option) && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {errors.workTypes && (
                      <p className="text-red-500 text-sm mt-1">{errors.workTypes.message}</p>
                    )}
                  </div>

                  <div>
                    <Controller
                      name="isHistoricDistrict"
                      control={control}
                      render={({ field }) => (
                        <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-medium text-amber-800">Historic District</span>
                            <p className="text-sm text-amber-600">
                              Check if the property is in a designated historic district (may require additional review)
                            </p>
                          </div>
                        </label>
                      )}
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-[#4A90D9] mb-2">Upload Documents</h2>
                  <p className="text-gray-600 mb-6">
                    Based on your permit types, here's what you'll need to submit.
                  </p>

                  <FileUploadZone
                    files={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    requiredDocs={requiredDocs}
                  />
                </motion.div>
              )}

              {/* Step 5: Review & Pay */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-bold text-[#4A90D9] mb-6">Review & Submit</h2>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-[#4A90D9]">Application Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Project</p>
                        <p className="font-medium text-[#4A90D9]">{watch('projectName') || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Address</p>
                        <p className="font-medium text-[#4A90D9]">
                          {watch('address') ? `${watch('address')}, ${watch('city')}, ${watch('state')} ${watch('zipCode')}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Permit Types</p>
                        <p className="font-medium text-[#4A90D9]">
                          {watchPermitTypes.length > 0
                            ? watchPermitTypes.map(t => permitTypeOptions.find(o => o.id === t)?.label).join(', ')
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Documents</p>
                        <p className="font-medium text-[#4A90D9]">{uploadedFiles.length} files uploaded</p>
                      </div>
                    </div>
                  </div>

                  {/* Package Selection */}
                  <div>
                    <h3 className="font-semibold text-[#4A90D9] mb-4">Select Your Package</h3>
                    <Controller
                      name="packageType"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-4">
                          {packageOptions.map((pkg) => (
                            <label
                              key={pkg.id}
                              className={`relative p-4 border rounded-xl cursor-pointer transition-all ${
                                field.value === pkg.id
                                  ? 'border-[#E8793A] ring-2 ring-[#E8793A]/20'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                checked={field.value === pkg.id}
                                onChange={() => field.onChange(pkg.id)}
                                className="hidden"
                              />
                              {pkg.popular && (
                                <span className="absolute -top-2 left-4 px-2 py-0.5 bg-[#E8793A] text-white text-xs font-medium rounded-full">
                                  Most Popular
                                </span>
                              )}
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-bold text-[#4A90D9]">{pkg.name}</p>
                                  <p className="text-sm text-gray-500">{pkg.description}</p>
                                </div>
                                <p className="text-xl font-bold font-mono text-[#4A90D9]">
                                  ${pkg.price.toLocaleString()}
                                </p>
                              </div>
                              <ul className="mt-3 space-y-1">
                                {pkg.features.slice(0, 3).map((feature, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#38A169]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-[#4A90D9] text-white rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-300">Package</span>
                      <span className="font-semibold">{selectedPackage?.name}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-300">Subtotal</span>
                      <span className="font-semibold">${selectedPackage?.price.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                      <span className="text-lg">Total Due</span>
                      <span className="text-2xl font-bold font-mono">${selectedPackage?.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Stripe Payment Placeholder */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-[#4A90D9] mb-4">Payment Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                      <p>Stripe Elements payment form would appear here</p>
                      <p className="text-sm mt-2">Card number, expiry, CVC</p>
                    </div>
                  </div>

                  {/* Terms */}
                  <Controller
                    name="agreeToTerms"
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#E8793A] focus:ring-[#E8793A]"
                        />
                        <span className="text-sm text-gray-600">
                          I agree to the{' '}
                          <Link href="/terms" className="text-[#E8793A] hover:underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" className="text-[#E8793A] hover:underline">
                            Privacy Policy
                          </Link>
                          . I understand that submitting this application does not guarantee permit approval.
                        </span>
                      </label>
                    )}
                  />
                  {errors.agreeToTerms && (
                    <p className="text-red-500 text-sm">{errors.agreeToTerms.message}</p>
                  )}

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Secure checkout
                    </span>
                    <span>•</span>
                    <span>256-bit encryption</span>
                    <span>•</span>
                    <span>Powered by Stripe</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={goToPrevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2.5 font-medium rounded-lg transition-colors ${
                  currentStep === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                ← Back
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="px-6 py-2.5 bg-[#E8793A] text-white font-semibold rounded-lg hover:bg-[#d16a2f] transition-colors"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-8 py-3 bg-[#38A169] text-white font-semibold rounded-lg hover:bg-[#2f8a58] transition-colors"
                >
                  Submit Application & Pay ${selectedPackage?.price.toLocaleString()}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
