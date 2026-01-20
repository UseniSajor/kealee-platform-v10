'use client';

import { useState } from 'react';
import { ArrowRight, Upload, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Card } from '@kealee/ui';

export default function QuoteRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: '',
    scope: '',
    timeline: '',
    budget: '',
    files: [] as File[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const projectTypes = [
    { id: 'residential', name: 'Residential', icon: '🏠' },
    { id: 'commercial', name: 'Commercial', icon: '🏢' },
    { id: 'renovation', name: 'Renovation', icon: '🔨' },
    { id: 'addition', name: 'Addition', icon: '➕' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, files: Array.from(e.target.files) });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.projectType) {
      newErrors.projectType = 'Please select a project type';
    }
    if (!formData.scope.trim()) {
      newErrors.scope = 'Please describe your project scope';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // const formDataToSend = new FormData();
      // Object.entries(formData).forEach(([key, value]) => {
      //   if (key === 'files') {
      //     formData.files.forEach((file) => {
      //       formDataToSend.append('files', file);
      //     });
      //   } else {
      //     formDataToSend.append(key, value);
      //   }
      // });
      
      // const response = await fetch('/api/quote', {
      //   method: 'POST',
      //   body: formDataToSend,
      // });

      // Simulate submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      router.push('/quote/success');
    } catch (error) {
      console.error('Error submitting quote request:', error);
      setErrors({ submit: 'Failed to submit request. Please try again.' });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Get Your Free Quote
          </h1>
          <p className="text-lg text-gray-600">
            Tell us about your project and we'll provide a detailed quote within 24 hours
          </p>
        </div>

        {/* Form */}
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
              />
              <Input
                label="Email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />
            </div>

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />

            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Project Type <span className="text-red-500">*</span>
              </label>
              {errors.projectType && (
                <p className="text-sm text-red-600 mb-2">{errors.projectType}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {projectTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, projectType: type.id })}
                    className={`
                      p-4
                      border-2 rounded-lg
                      text-left
                      transition-all duration-200
                      ${
                        formData.projectType === type.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <div className="font-medium text-gray-900">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <Textarea
              label="Project Scope"
              required
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              placeholder="Briefly describe what you need designed..."
              rows={4}
              error={errors.scope}
              helperText="Be as detailed as possible for an accurate quote"
            />

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Budget Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['$3K-$5K', '$5K-$10K', '$10K-$20K', '$20K+'].map((range) => (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When do you need plans?
              </label>
              <select
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                className="
                  w-full px-4 py-3
                  border-2 border-gray-300 rounded-lg
                  focus:border-primary-500 focus:ring-2 focus:ring-primary-100
                  bg-white
                "
              >
                <option value="">Select timeline...</option>
                <option value="urgent">ASAP (1-2 weeks)</option>
                <option value="soon">Soon (2-4 weeks)</option>
                <option value="flexible">Flexible (4+ weeks)</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Existing Plans or Drawings{' '}
                <span className="text-gray-400">(Optional)</span>
              </label>
              <div
                className="
                  border-2 border-dashed border-gray-300 rounded-lg
                  p-8
                  text-center
                  hover:border-primary-500 hover:bg-primary-50
                  transition-all duration-200
                  cursor-pointer
                "
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.png"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Click to upload files
                </p>
                <p className="text-xs text-gray-500">
                  PDF, JPG, PNG up to 10MB
                </p>
                {formData.files.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    {formData.files.length} file(s) selected
                  </div>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-800">
                {errors.submit}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={submitting}
              rightIcon={!submitting ? <ArrowRight size={20} /> : undefined}
            >
              {submitting ? 'Submitting...' : 'Request Quote'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              We'll respond with a detailed quote within 24 hours
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
