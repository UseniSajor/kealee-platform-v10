'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@kealee/auth/client';
import { toast } from 'sonner';
import {
  Bell,
  Clock,
  Save,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const { profile, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      taskAssignments: true,
      clientMessages: true,
      weeklyDigest: false,
    },
    workload: {
      maxHoursPerWeek: 40,
      autoAcceptTasks: false,
      preferredWorkingHours: '9am - 5pm',
    },
    preferences: {
      theme: 'light',
      defaultView: 'work-queue',
    },
  });

  useEffect(() => {
    if (profile?.settings) {
      setSettings(profile.settings as any);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        settings: settings as any,
      });
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Settings
        </h1>
        <p className="text-gray-600">
          Manage your workspace preferences
        </p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">
            Notifications
          </h2>
        </div>

        <div className="space-y-4">
          <ToggleSetting
            label="Email Notifications"
            description="Receive updates via email"
            checked={settings.notifications.email}
            onChange={(checked) => setSettings({
              ...settings,
              notifications: {...settings.notifications, email: checked}
            })}
          />
          <ToggleSetting
            label="Push Notifications"
            description="Receive push notifications in browser"
            checked={settings.notifications.push}
            onChange={(checked) => setSettings({
              ...settings,
              notifications: {...settings.notifications, push: checked}
            })}
          />
          <ToggleSetting
            label="Task Assignments"
            description="Notify when new tasks are assigned"
            checked={settings.notifications.taskAssignments}
            onChange={(checked) => setSettings({
              ...settings,
              notifications: {...settings.notifications, taskAssignments: checked}
            })}
          />
          <ToggleSetting
            label="Client Messages"
            description="Notify when clients send messages"
            checked={settings.notifications.clientMessages}
            onChange={(checked) => setSettings({
              ...settings,
              notifications: {...settings.notifications, clientMessages: checked}
            })}
          />
          <ToggleSetting
            label="Weekly Digest"
            description="Receive weekly summary emails"
            checked={settings.notifications.weeklyDigest}
            onChange={(checked) => setSettings({
              ...settings,
              notifications: {...settings.notifications, weeklyDigest: checked}
            })}
          />
        </div>
      </div>

      {/* Workload */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900">
            Workload Management
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Hours per Week
            </label>
            <input
              type="number"
              value={settings.workload.maxHoursPerWeek}
              onChange={(e) => setSettings({
                ...settings,
                workload: {...settings.workload, maxHoursPerWeek: parseInt(e.target.value) || 40}
              })}
              min="20"
              max="60"
              className="
                w-full px-4 py-3
                border-2 border-gray-300 rounded-lg
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                transition-all duration-200
              "
            />
            <p className="mt-1 text-sm text-gray-500">
              This helps prevent over-assignment
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Working Hours
            </label>
            <input
              type="text"
              value={settings.workload.preferredWorkingHours}
              onChange={(e) => setSettings({
                ...settings,
                workload: {...settings.workload, preferredWorkingHours: e.target.value}
              })}
              placeholder="9am - 5pm"
              className="
                w-full px-4 py-3
                border-2 border-gray-300 rounded-lg
                focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                transition-all duration-200
              "
            />
          </div>

          <ToggleSetting
            label="Auto-accept Tasks"
            description="Automatically accept tasks assigned to you"
            checked={settings.workload.autoAcceptTasks}
            onChange={(checked) => setSettings({
              ...settings,
              workload: {...settings.workload, autoAcceptTasks: checked}
            })}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="
          w-full py-4
          bg-blue-600 hover:bg-blue-700
          text-white font-semibold text-lg
          rounded-lg
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          flex items-center justify-center gap-2
        "
      >
        {saving ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Saving...
          </>
        ) : (
          <>
            <Save size={20} />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}

function ToggleSetting({ 
  label, 
  description, 
  checked, 
  onChange 
}: { 
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
      <div>
        <h3 className="font-medium text-gray-900">{label}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative w-14 h-8 rounded-full transition-colors duration-200
          ${checked ? 'bg-blue-600' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            absolute top-1 left-1
            w-6 h-6 bg-white rounded-full
            transition-transform duration-200
            ${checked ? 'translate-x-6' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}




