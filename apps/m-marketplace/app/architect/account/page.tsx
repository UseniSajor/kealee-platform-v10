'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@kealee/auth/client';
import { useRouter } from 'next/navigation';
import { signOut } from '@kealee/auth/client';
import { Loader2, User, Mail, LogOut, Save } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { profile, loading, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
      });
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error: any) {
      alert('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Profile Information
          </h2>

          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="
                w-20 h-20
                bg-blue-100 text-blue-600
                rounded-full
                flex items-center justify-center
                text-2xl font-bold
              ">
                {formData.full_name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <button className="
                  px-4 py-2
                  border-2 border-gray-300
                  text-gray-700 font-medium
                  rounded-lg
                  hover:border-gray-400
                  transition-all duration-200
                ">
                  Change Photo
                </button>
                <p className="mt-1 text-sm text-gray-500">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="
                    w-full pl-11 pr-4 py-3
                    border-2 border-gray-300 rounded-lg
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="
                    w-full pl-11 pr-4 py-3
                    border-2 border-gray-300 rounded-lg
                    bg-gray-50
                    cursor-not-allowed
                  "
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Role */}
            {profile?.role && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="
                  px-4 py-3
                  border-2 border-gray-200 rounded-lg
                  bg-gray-50
                ">
                  <span className="
                    inline-block px-3 py-1
                    bg-blue-100 text-blue-700
                    rounded-full text-sm font-medium
                  ">
                    {profile.role}
                  </span>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="
                w-full py-3
                bg-blue-600 hover:bg-blue-700
                text-white font-semibold
                rounded-lg
                shadow-md hover:shadow-lg
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Security
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/architect/auth/forgot-password')}
              className="
                w-full px-6 py-3
                border-2 border-gray-300
                text-gray-700 font-medium
                rounded-lg
                hover:border-gray-400
                transition-all duration-200
                text-left
              "
            >
              Change Password
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border-2 border-red-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-red-900 mb-2">
            Danger Zone
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Once you sign out, you'll need to log in again to access your account.
          </p>

          <button
            onClick={handleSignOut}
            className="
              px-6 py-3
              bg-red-600 hover:bg-red-700
              text-white font-semibold
              rounded-lg
              shadow-md hover:shadow-lg
              transition-all duration-200
              flex items-center gap-2
            "
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
