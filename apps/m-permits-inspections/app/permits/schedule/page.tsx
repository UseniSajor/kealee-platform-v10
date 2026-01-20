'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle } from 'lucide-react';
import { Button, Input, Card } from '@kealee/ui';

export default function ScheduleInspectionPage() {
  const [formData, setFormData] = useState({
    permitId: '',
    inspectionType: '',
    preferredDate: '',
    preferredTime: '',
    contactPhone: '',
    specialInstructions: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inspectionTypes = [
    { id: 'foundation', name: 'Foundation', duration: '2 hours' },
    { id: 'framing', name: 'Framing', duration: '2-3 hours' },
    { id: 'electrical', name: 'Electrical', duration: '1-2 hours' },
    { id: 'plumbing', name: 'Plumbing', duration: '1-2 hours' },
    { id: 'final', name: 'Final', duration: '1 hour' },
  ];

  const timeSlots = [
    '8:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '12:00 PM - 2:00 PM',
    '2:00 PM - 4:00 PM',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Replace with actual API call
      // await fetch('/api/inspections/schedule', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch (error) {
      console.error('Error scheduling inspection:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Inspection Scheduled!
          </h2>
          <p className="text-gray-600 mb-6">
            Your inspection has been scheduled. You'll receive a confirmation email shortly.
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/permits/status'}>
            View Permit Status
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Schedule Inspection
          </h1>
          <p className="text-gray-600">
            Select your preferred date and time for the site inspection
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Permit Application ID"
              required
              value={formData.permitId}
              onChange={(e) => setFormData({ ...formData, permitId: e.target.value })}
              placeholder="PER-2024-001234"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Inspection Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {inspectionTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, inspectionType: type.id })}
                    className={`
                      p-4 border-2 rounded-lg text-left transition-all duration-200
                      ${formData.inspectionType === type.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    <div className="font-medium text-gray-900">{type.name}</div>
                    <div className="text-sm text-gray-600">{type.duration}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Preferred Date"
                type="date"
                required
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                leftIcon={<Calendar size={20} />}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Select time...</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Contact Phone"
              type="tel"
              required
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="(555) 123-4567"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 resize-none"
                placeholder="Any special access instructions or notes..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={submitting}
            >
              Schedule Inspection
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
