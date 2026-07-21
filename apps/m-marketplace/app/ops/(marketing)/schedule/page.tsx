'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    meetingType: 'demo',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          date: date.toISOString().split('T')[0],
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNum: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
        });
      }
    }
    return dates.slice(0, 10);
  };

  const timeSlots = [
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
  ];

  const meetingTypes = [
    { id: 'demo', label: 'Platform Demo', duration: '30 min', description: 'See the platform in action' },
    { id: 'consultation', label: 'Strategy Consultation', duration: '45 min', description: 'Discuss your needs' },
    { id: 'onboarding', label: 'Onboarding Call', duration: '60 min', description: 'Get started with your account' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
  };

  const availableDates = getAvailableDates();

  if (submitted) {
    const selectedMeeting = meetingTypes.find(m => m.id === formData.meetingType);
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl border border-black/10 bg-white p-12 shadow-sm">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black">Meeting Scheduled!</h1>
          <div className="mt-4 p-4 bg-zinc-50 rounded-xl">
            <p className="font-bold text-lg">{selectedMeeting?.label}</p>
            <p className="text-zinc-600 mt-1">
              {availableDates.find(d => d.date === selectedDate)?.day},{' '}
              {availableDates.find(d => d.date === selectedDate)?.month}{' '}
              {availableDates.find(d => d.date === selectedDate)?.dayNum} at {selectedTime}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              Duration: {selectedMeeting?.duration}
            </p>
          </div>
          <p className="mt-4 text-sm text-zinc-600">
            A calendar invite has been sent to {formData.email}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-95"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-8"
      >
        ← Back to Home
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-black tracking-tight">Schedule a Call</h1>
        <p className="mt-3 text-lg text-zinc-600">
          Pick a time that works for you. We'll connect via Google Meet or Zoom.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Meeting Type Selection */}
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4">1. Select Meeting Type</h2>
            <div className="space-y-3">
              {meetingTypes.map((type) => (
                <label
                  key={type.id}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition ${
                    formData.meetingType === type.id
                      ? 'border-[var(--primary)] bg-sky-50'
                      : 'border-black/10 hover:border-black/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="meetingType"
                    value={type.id}
                    checked={formData.meetingType === type.id}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-zinc-900">{type.label}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">{type.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                      {type.duration}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4">2. Pick a Date & Time</h2>

            <div className="mb-6">
              <p className="text-sm font-semibold text-zinc-700 mb-3">Select Date</p>
              <div className="grid grid-cols-5 gap-2">
                {availableDates.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate(d.date)}
                    className={`p-2 rounded-lg text-center transition ${
                      selectedDate === d.date
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-zinc-50 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="text-[10px] font-medium opacity-70">{d.day}</div>
                    <div className="text-lg font-bold">{d.dayNum}</div>
                    <div className="text-[10px] font-medium opacity-70">{d.month}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div>
                <p className="text-sm font-semibold text-zinc-700 mb-3">Select Time (EST)</p>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                        selectedTime === time
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-zinc-50 hover:bg-zinc-100'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black mb-4">3. Your Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  placeholder="Smith Construction"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                  placeholder="(202) 555-0123"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                  placeholder="Anything you'd like us to know?"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="submit"
            disabled={!selectedDate || !selectedTime || !formData.name || !formData.email}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-8 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Booking
          </button>
          <p className="mt-3 text-xs text-zinc-500">
            You'll receive a calendar invite with a meeting link
          </p>
        </div>
      </form>
    </main>
  );
}
