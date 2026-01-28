'use client';

import { useState } from 'react';
import { ArrowRight, Upload, Check } from 'lucide-react';

export default function QuoteRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: '',
    scope: '',
    timeline: '',
    budget: '',
    hasPlans: false,
  });

  const projectTypes = [
    { id: 'residential', name: 'Residential', icon: '🏠' },
    { id: 'commercial', name: 'Commercial', icon: '🏢' },
    { id: 'renovation', name: 'Renovation', icon: '🔨' },
    { id: 'addition', name: 'Addition', icon: '➕' },
  ];

  const handleSubmit = async () => {
    // Submit to API
    // Redirect to success page
    window.location.href = '/quote/success';
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
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          
          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="
                  w-full px-4 py-3
                  border-2 border-gray-300 rounded-lg
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="
                  w-full px-4 py-3
                  border-2 border-gray-300 rounded-lg
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                "
              />
            </div>
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Project Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {projectTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setFormData({...formData, projectType: type.id})}
                  className={`
                    p-4
                    border-2 rounded-lg
                    text-left
                    transition-all duration-200
                    ${formData.projectType === type.id
                      ? 'border-blue-600 bg-blue-50'
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Scope *
            </label>
            <textarea
              value={formData.scope}
              onChange={(e) => setFormData({...formData, scope: e.target.value})}
              rows={4}
              placeholder="Briefly describe what you need designed..."
              className="
                w-full px-4 py-3
                border-2 border-gray-300 rounded-lg
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                resize-none
              "
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Budget Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['$3K-$5K', '$5K-$10K', '$10K-$20K', '$20K+'].map(range => (
                <button
                  key={range}
                  onClick={() => setFormData({...formData, budget: range})}
                  className={`
                    px-4 py-3
                    border-2 rounded-lg
                    font-medium
                    transition-all duration-200
                    ${formData.budget === range
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
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
              onChange={(e) => setFormData({...formData, timeline: e.target.value})}
              className="
                w-full px-4 py-3
                border-2 border-gray-300 rounded-lg
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
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
              Existing Plans or Drawings <span className="text-gray-400">(Optional)</span>
            </label>
            <div
              className="
                border-2 border-dashed border-gray-300 rounded-lg
                p-8
                text-center
                hover:border-blue-500 hover:bg-blue-50
                transition-all duration-200
                cursor-pointer
              "
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mx-auto text-gray-400 mb-3" size={32} />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload files
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG up to 10MB
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.jpg,.png"
                className="hidden"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="
              w-full py-4
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold text-lg
              rounded-lg
              shadow-lg hover:shadow-xl
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            Request Quote
            <ArrowRight size={20} />
          </button>

          <p className="text-center text-sm text-gray-500">
            We'll respond with a detailed quote within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}
