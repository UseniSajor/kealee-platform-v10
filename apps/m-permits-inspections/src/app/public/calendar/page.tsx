'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Users, Video, Building } from 'lucide-react';

interface PublicEvent {
  id: string;
  title: string;
  type: 'hearing' | 'meeting' | 'workshop' | 'session';
  date: string;
  time: string;
  location: string;
  description: string;
  virtual: boolean;
  virtualLink?: string;
}

export default function PublicCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const events: PublicEvent[] = [
    {
      id: '1',
      title: 'Planning Commission Meeting',
      type: 'meeting',
      date: '2025-02-05',
      time: '6:00 PM',
      location: 'City Hall, Room 201',
      description: 'Monthly planning commission meeting to review pending development proposals.',
      virtual: true,
      virtualLink: 'https://zoom.us/meeting',
    },
    {
      id: '2',
      title: 'Zoning Board Public Hearing',
      type: 'hearing',
      date: '2025-02-12',
      time: '7:00 PM',
      location: 'City Hall, Council Chambers',
      description: 'Public hearing on proposed zoning amendments for the downtown district.',
      virtual: true,
      virtualLink: 'https://zoom.us/meeting',
    },
    {
      id: '3',
      title: 'Homeowner Permit Workshop',
      type: 'workshop',
      date: '2025-02-15',
      time: '10:00 AM',
      location: 'Community Center',
      description: 'Free workshop for homeowners on the permit application process.',
      virtual: false,
    },
    {
      id: '4',
      title: 'Board of Appeals Session',
      type: 'session',
      date: '2025-02-20',
      time: '2:00 PM',
      location: 'City Hall, Room 105',
      description: 'Review session for permit appeals and variance requests.',
      virtual: true,
      virtualLink: 'https://zoom.us/meeting',
    },
    {
      id: '5',
      title: 'Building Code Update Session',
      type: 'session',
      date: '2025-02-25',
      time: '1:00 PM',
      location: 'Virtual Only',
      description: 'Information session on upcoming building code changes effective March 2025.',
      virtual: true,
      virtualLink: 'https://zoom.us/meeting',
    },
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'hearing':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'meeting':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'workshop':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'session':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'hearing':
        return 'Public Hearing';
      case 'meeting':
        return 'Meeting';
      case 'workshop':
        return 'Workshop';
      case 'session':
        return 'Session';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">

      {/* Back Link */}
      <Link
        href="/public"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
      >
        <ArrowLeft size={16} />
        Back to Public Portal
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Calendar className="text-white" size={32} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Public Hearings & Meetings
        </h1>
        <p className="text-xl text-gray-600">
          View upcoming public hearings, board meetings, and planning sessions
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600">Public Hearing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">Meeting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">Workshop</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm text-gray-600">Session</span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>

        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </span>
                        {event.virtual && (
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Video size={14} />
                            Virtual Option Available
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {event.title}
                      </h3>

                      <p className="text-gray-600 mb-4">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={16} />
                          {event.location}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      {event.virtual && event.virtualLink && (
                        <a
                          href={event.virtualLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                        >
                          <Video size={16} />
                          Join Virtual Meeting
                        </a>
                      )}
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition">
                        <Calendar size={16} />
                        Add to Calendar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No upcoming events</h3>
            <p className="text-gray-600">
              Check back later for scheduled public hearings and meetings.
            </p>
          </div>
        )}
      </div>

      {/* Subscribe CTA */}
      <div className="mt-12 bg-blue-50 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Stay Informed</h3>
            <p className="text-gray-600">
              Subscribe to receive notifications about upcoming public hearings and meetings.
            </p>
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mt-8 text-center text-gray-600">
        <p>
          Questions about public hearings?{' '}
          <a href="mailto:planning@kealee.com" className="text-blue-600 hover:text-blue-700 font-medium">
            Contact the Planning Department
          </a>
        </p>
      </div>

    </div>
  );
}
