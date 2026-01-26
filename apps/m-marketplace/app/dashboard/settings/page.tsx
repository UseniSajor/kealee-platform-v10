'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Building,
  Bell,
  Shield,
  CreditCard,
  Save,
  Loader2,
  Camera,
  CheckCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: 'John Smith',
    email: 'john@company.com',
    phone: '(555) 123-4567',
    company: 'Smith Construction LLC',
    role: 'Project Owner',
    notifications: {
      email: true,
      sms: false,
      push: true,
      projectUpdates: true,
      milestoneAlerts: true,
      paymentReminders: true,
      marketingEmails: false,
    },
  });

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Profile Information</h2>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={40} className="text-blue-600" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <Camera size={16} />
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{formData.name}</h3>
                <p className="text-slate-500 text-sm">{formData.role}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Notification Preferences</h2>

            <div className="space-y-6">
              <div className="pb-6 border-b border-slate-100">
                <h3 className="font-medium text-slate-900 mb-4">Notification Channels</h3>
                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
                    { key: 'sms', label: 'SMS Notifications', description: 'Receive text message alerts' },
                    { key: 'push', label: 'Push Notifications', description: 'Browser and mobile push notifications' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              [item.key]: !formData.notifications[item.key as keyof typeof formData.notifications],
                            },
                          })
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          formData.notifications[item.key as keyof typeof formData.notifications]
                            ? 'bg-blue-600'
                            : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            formData.notifications[item.key as keyof typeof formData.notifications]
                              ? 'translate-x-6'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 mb-4">Alert Types</h3>
                <div className="space-y-4">
                  {[
                    { key: 'projectUpdates', label: 'Project Updates', description: 'Updates on your project status' },
                    { key: 'milestoneAlerts', label: 'Milestone Alerts', description: 'Notifications when milestones are reached' },
                    { key: 'paymentReminders', label: 'Payment Reminders', description: 'Reminders for upcoming payments' },
                    { key: 'marketingEmails', label: 'Marketing Emails', description: 'News, tips, and special offers' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{item.label}</p>
                        <p className="text-sm text-slate-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() =>
                          setFormData({
                            ...formData,
                            notifications: {
                              ...formData.notifications,
                              [item.key]: !formData.notifications[item.key as keyof typeof formData.notifications],
                            },
                          })
                        }
                        className={`w-12 h-6 rounded-full transition-colors ${
                          formData.notifications[item.key as keyof typeof formData.notifications]
                            ? 'bg-blue-600'
                            : 'bg-slate-200'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            formData.notifications[item.key as keyof typeof formData.notifications]
                              ? 'translate-x-6'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Security Settings</h2>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-xl">
                <h3 className="font-medium text-slate-900 mb-2">Change Password</h3>
                <p className="text-sm text-slate-500 mb-4">Update your password to keep your account secure</p>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Current password"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-slate-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                    Not enabled
                  </span>
                </div>
                <button className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
                  Enable 2FA
                </button>
              </div>

              <div className="p-6 bg-red-50 rounded-xl border border-red-100">
                <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Billing & Subscription</h2>

            <div className="space-y-6">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm">Current Plan</p>
                    <h3 className="text-2xl font-bold">Professional</h3>
                  </div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Active</span>
                </div>
                <p className="text-blue-100 mb-4">Unlimited projects, priority support, and all premium features</p>
                <button className="px-6 py-2.5 bg-white text-blue-600 font-medium rounded-xl hover:bg-blue-50 transition-colors">
                  Upgrade Plan
                </button>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl">
                <h3 className="font-medium text-slate-900 mb-4">Payment Method</h3>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
                  <div className="w-12 h-8 bg-slate-900 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Visa ending in 4242</p>
                    <p className="text-sm text-slate-500">Expires 12/25</p>
                  </div>
                  <button className="ml-auto text-blue-600 text-sm font-medium hover:text-blue-700">
                    Update
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-xl">
                <h3 className="font-medium text-slate-900 mb-4">Billing History</h3>
                <div className="space-y-3">
                  {[
                    { date: 'Jan 1, 2024', amount: '$99.00', status: 'Paid' },
                    { date: 'Dec 1, 2023', amount: '$99.00', status: 'Paid' },
                    { date: 'Nov 1, 2023', amount: '$99.00', status: 'Paid' },
                  ].map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-900">{invoice.date}</p>
                        <p className="text-sm text-slate-500">Professional Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">{invoice.amount}</p>
                        <span className="text-xs text-green-600 font-medium">{invoice.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">Changes saved successfully</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
