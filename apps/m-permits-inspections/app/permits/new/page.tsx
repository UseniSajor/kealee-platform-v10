'use client';

import { useState, useEffect } from 'react';
import { MapPin, FileText, Upload, CreditCard, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Input, ProgressBar, StepIndicator } from '@kealee/ui';
import { Card } from '@kealee/ui';

const STEPS = [
  { id: 'location', title: 'Location', subtitle: 'Project address' },
  { id: 'type', title: 'Permit Type', subtitle: 'Select permits needed' },
  { id: 'documents', title: 'Documents', subtitle: 'Upload and AI review' },
  { id: 'payment', title: 'Payment', subtitle: 'Submit application' },
];

interface PermitFormData {
  address: string;
  jurisdiction: string | null;
  permitTypes: string[];
  documents: File[];
  aiReview: any | null;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
}

export default function NewPermitPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<PermitFormData>({
    address: '',
    jurisdiction: null,
    permitTypes: [],
    documents: [],
    aiReview: null,
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      if (!formData.jurisdiction) {
        newErrors.jurisdiction = 'Please select a valid address';
      }
    }

    if (currentStep === 1) {
      if (formData.permitTypes.length === 0) {
        newErrors.permitTypes = 'Please select at least one permit type';
      }
    }

    if (currentStep === 2) {
      if (formData.documents.length === 0) {
        newErrors.documents = 'Please upload at least one document';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitApplication = async () => {
    if (!validateCurrentStep()) return;

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/permits', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      router.push('/permits/success');
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Progress Indicator */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* Progress Bar */}
        <div className="mt-6">
          <ProgressBar value={progress} showLabel variant="success" />
        </div>

        {/* Main Form Card */}
        <Card className="mt-8 p-8">
          {/* Step Content */}
          {currentStep === 0 && (
            <StepLocation formData={formData} setFormData={setFormData} errors={errors} />
          )}
          {currentStep === 1 && (
            <StepPermitType formData={formData} setFormData={setFormData} errors={errors} />
          )}
          {currentStep === 2 && (
            <StepDocuments formData={formData} setFormData={setFormData} errors={errors} />
          )}
          {currentStep === 3 && (
            <StepPayment formData={formData} setFormData={setFormData} />
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
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={submitApplication}
                className="bg-green-600 hover:bg-green-700"
                leftIcon={<CheckCircle size={20} />}
              >
                Submit Application
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// STEP 1: LOCATION
function StepLocation({
  formData,
  setFormData,
  errors,
}: {
  formData: PermitFormData;
  setFormData: (data: PermitFormData) => void;
  errors: Record<string, string>;
}) {
  const [suggestions, setSuggestions] = useState<Array<{ address: string; jurisdiction: string }>>([]);

  const handleAddressChange = async (address: string) => {
    setFormData({ ...formData, address, jurisdiction: null });
    
    // Simulated address autocomplete
    if (address.length > 3) {
      // TODO: Call Google Places API
      setSuggestions([
        { address: '1234 Main St, Washington, DC 20001', jurisdiction: 'Washington, DC' },
        { address: '1234 Main St, Baltimore, MD 21201', jurisdiction: 'Baltimore, MD' },
        { address: '1234 Main St, Arlington, VA 22201', jurisdiction: 'Arlington, VA' },
      ]);
    } else {
      setSuggestions([]);
    }
  };

  const selectAddress = (suggestion: { address: string; jurisdiction: string }) => {
    setFormData({
      ...formData,
      address: suggestion.address,
      jurisdiction: suggestion.jurisdiction,
    });
    setSuggestions([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Where is your project located?
        </h2>
        <p className="text-gray-600">
          We'll automatically detect the jurisdiction and requirements
        </p>
      </div>

      {/* Address Search */}
      <div className="relative">
        <Input
          label="Project Address"
          required
          value={formData.address}
          onChange={(e) => handleAddressChange(e.target.value)}
          placeholder="Enter project address..."
          error={errors.address}
          autoFocus
          leftIcon={<MapPin size={20} />}
        />
        
        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg z-10">
            {suggestions.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectAddress(item)}
                className="
                  w-full px-6 py-4
                  text-left
                  hover:bg-gray-50
                  border-b border-gray-100 last:border-0
                  transition-colors duration-150
                "
              >
                <div className="font-medium text-gray-900">{item.address}</div>
                <div className="text-sm text-gray-600">Jurisdiction: {item.jurisdiction}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Jurisdiction Info Card */}
      {formData.jurisdiction && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900 mb-2">
                Jurisdiction Detected: {formData.jurisdiction}
              </h3>
              <div className="space-y-1 text-sm text-primary-800">
                <p>• Typical approval time: 21 days</p>
                <p>• Estimated fees: $350-$500</p>
                <p>• Requirements: Site plan, floor plan, elevations</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// STEP 2: PERMIT TYPE
function StepPermitType({
  formData,
  setFormData,
  errors,
}: {
  formData: PermitFormData;
  setFormData: (data: PermitFormData) => void;
  errors: Record<string, string>;
}) {
  const permitTypes = [
    { id: 'building', name: 'Building Permit', fee: 150, icon: '🏗️', desc: 'New construction, additions, renovations' },
    { id: 'electrical', name: 'Electrical', fee: 85, icon: '⚡', desc: 'Wiring, service upgrades, panels' },
    { id: 'plumbing', name: 'Plumbing', fee: 85, icon: '🚰', desc: 'Pipes, fixtures, water heaters' },
    { id: 'mechanical', name: 'Mechanical', fee: 85, icon: '❄️', desc: 'HVAC, ventilation, air conditioning' },
  ];

  const togglePermitType = (id: string) => {
    const current = formData.permitTypes || [];
    const updated = current.includes(id)
      ? current.filter((t) => t !== id)
      : [...current, id];
    setFormData({ ...formData, permitTypes: updated });
  };

  const totalFees = (formData.permitTypes || []).reduce((sum, id) => {
    const permit = permitTypes.find((p) => p.id === id);
    return sum + (permit?.fee || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          What type of permits do you need?
        </h2>
        <p className="text-gray-600">
          Select all that apply to your project
        </p>
      </div>

      {errors.permitTypes && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800">
          {errors.permitTypes}
        </div>
      )}

      {/* Permit Type Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {permitTypes.map((permit) => (
          <button
            key={permit.id}
            type="button"
            onClick={() => togglePermitType(permit.id)}
            className={`
              p-6
              border-2 rounded-xl
              text-left
              transition-all duration-200
              ${
                (formData.permitTypes || []).includes(permit.id)
                  ? 'border-primary-600 bg-primary-50 shadow-md'
                  : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl">{permit.icon}</div>
              {(formData.permitTypes || []).includes(permit.id) && (
                <CheckCircle className="text-primary-600" size={24} />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {permit.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">{permit.desc}</p>
            <p className="text-lg font-semibold text-primary-600">
              ${permit.fee}
            </p>
          </button>
        ))}
      </div>

      {/* Total Fees */}
      {totalFees > 0 && (
        <Card className="bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Total Permit Fees</span>
            <span className="text-2xl font-bold text-gray-900">${totalFees}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

// STEP 3: DOCUMENTS WITH AI REVIEW
function StepDocuments({
  formData,
  setFormData,
  errors,
}: {
  formData: PermitFormData;
  setFormData: (data: PermitFormData) => void;
  errors: Record<string, string>;
}) {
  const [uploading, setUploading] = useState(false);
  const [aiReviewing, setAiReviewing] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  const requiredDocs = [
    { id: 'site_plan', name: 'Site Plan' },
    { id: 'floor_plan', name: 'Floor Plan' },
    { id: 'elevations', name: 'Elevation Drawings' },
  ];

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    
    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const fileArray = Array.from(files);
    setFormData({ ...formData, documents: [...formData.documents, ...fileArray] });
    
    // Mark documents as uploaded
    const newUploaded = { ...uploadedDocs };
    fileArray.forEach(() => {
      requiredDocs.forEach((doc) => {
        if (!newUploaded[doc.id]) {
          newUploaded[doc.id] = true;
        }
      });
    });
    setUploadedDocs(newUploaded);
    
    setUploading(false);
    setAiReviewing(true);
    
    // Simulate AI review
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    const aiResults = {
      score: 95,
      issues: [
        { type: 'warning', message: 'Floor plan missing dimension on north wall' },
      ],
      suggestions: [
        'Consider adding property survey for faster approval',
      ],
    };
    
    setFormData({ ...formData, aiReview: aiResults });
    setAiReviewing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Upload Your Documents
        </h2>
        <p className="text-gray-600">
          Our AI will review them in real-time and catch common errors
        </p>
      </div>

      {errors.documents && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800">
          {errors.documents}
        </div>
      )}

      {/* Required Documents Checklist */}
      <Card className="bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-4">Required Documents</h3>
        <div className="space-y-2">
          {requiredDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3">
              <div
                className={`
                  w-6 h-6 rounded border-2 flex items-center justify-center
                  ${uploadedDocs[doc.id] ? 'bg-green-500 border-green-500' : 'border-gray-300'}
                `}
              >
                {uploadedDocs[doc.id] && <CheckCircle className="text-white" size={16} />}
              </div>
              <span
                className={uploadedDocs[doc.id] ? 'text-gray-900 font-medium' : 'text-gray-600'}
              >
                {doc.name}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Upload Zone */}
      <div
        className="
          border-2 border-dashed border-gray-300 rounded-xl
          p-12
          text-center
          hover:border-primary-500 hover:bg-primary-50
          transition-all duration-200
          cursor-pointer
        "
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.jpg,.png"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        
        <Upload className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drag files here or click to browse
        </p>
        <p className="text-sm text-gray-600">
          Accepts PDF, JPG, PNG up to 10MB each
        </p>
      </div>

      {/* Uploading State */}
      {uploading && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <span className="text-primary-900 font-medium">Uploading files...</span>
          </div>
        </Card>
      )}

      {/* AI Review State */}
      {aiReviewing && (
        <Card className="bg-purple-50 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="animate-pulse text-3xl">🤖</div>
            <div>
              <p className="font-semibold text-purple-900">AI Review in Progress</p>
              <p className="text-sm text-purple-700">Checking for common errors...</p>
            </div>
          </div>
        </Card>
      )}

      {/* AI Results */}
      {formData.aiReview && (
        <div className="space-y-4">
          {/* Score */}
          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                {formData.aiReview.score}
              </div>
              <div>
                <p className="font-semibold text-green-900 text-lg">Excellent!</p>
                <p className="text-green-700">
                  {formData.aiReview.score}% likely to be approved
                </p>
              </div>
            </div>
          </Card>

          {/* Issues */}
          {formData.aiReview.issues && formData.aiReview.issues.length > 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-4">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                <div>
                  <p className="font-semibold text-yellow-900 mb-2">Minor Issues Found</p>
                  <ul className="space-y-1">
                    {formData.aiReview.issues.map((issue: any, i: number) => (
                      <li key={i} className="text-sm text-yellow-800">
                        • {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Suggestions */}
          {formData.aiReview.suggestions && formData.aiReview.suggestions.length > 0 && (
            <Card className="bg-primary-50 border-primary-200">
              <p className="font-semibold text-primary-900 mb-2">💡 Suggestions</p>
              <ul className="space-y-1">
                {formData.aiReview.suggestions.map((suggestion: string, i: number) => (
                  <li key={i} className="text-sm text-primary-800">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// STEP 4: PAYMENT
function StepPayment({
  formData,
  setFormData,
}: {
  formData: PermitFormData;
  setFormData: (data: PermitFormData) => void;
}) {
  const permitTypes = [
    { id: 'building', name: 'Building Permit', fee: 150 },
    { id: 'electrical', name: 'Electrical', fee: 85 },
    { id: 'plumbing', name: 'Plumbing', fee: 85 },
    { id: 'mechanical', name: 'Mechanical', fee: 85 },
  ];

  const totalFees = (formData.permitTypes || []).reduce((sum, id) => {
    const permit = permitTypes.find((p) => p.id === id);
    return sum + (permit?.fee || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Review & Submit
        </h2>
        <p className="text-gray-600">
          Review your application and submit payment
        </p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gray-50">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">📍 Location</p>
            <p className="font-medium text-gray-900">{formData.address}</p>
            <p className="text-sm text-gray-600">{formData.jurisdiction}</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-2">📋 Permit Types</p>
            <div className="space-y-1">
              {formData.permitTypes.map((id) => {
                const permit = permitTypes.find((p) => p.id === id);
                return permit ? (
                  <div key={id} className="flex justify-between">
                    <span className="text-gray-900">{permit.name}</span>
                    <span className="text-gray-600">${permit.fee}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 mb-1">📄 Documents</p>
            <p className="font-medium text-gray-900">
              {formData.documents.length} file(s) uploaded
            </p>
          </div>

          {formData.aiReview && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 mb-1">⚠️ AI Pre-Review Results</p>
              <p className="font-medium text-green-600">
                ✅ {formData.aiReview.score}% likely to be approved
              </p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Fees</span>
            <span className="text-3xl font-bold text-gray-900">${totalFees}</span>
          </div>
        </div>
      </Card>

      {/* Applicant Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Applicant Information</h3>
        <Input
          label="Full Name"
          required
          value={formData.applicantName}
          onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
          placeholder="Enter your full name"
        />
        <Input
          label="Email"
          type="email"
          required
          value={formData.applicantEmail}
          onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
          placeholder="your.email@example.com"
        />
        <Input
          label="Phone"
          type="tel"
          required
          value={formData.applicantPhone}
          onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Payment Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          💳 Payment will be processed securely through Stripe after you click "Submit Application"
        </p>
      </Card>
    </div>
  );
}
