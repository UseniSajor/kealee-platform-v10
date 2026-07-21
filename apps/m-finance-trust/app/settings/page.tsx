'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, CreditCard, Bell, Shield, User, Building2, Check, ChevronRight, Plus } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'payment' | 'notifications' | 'security' | 'account'>('payment');

  const tabs = [
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
  ];

  const paymentMethods = [
    {
      id: '1',
      type: 'bank',
      name: 'Chase Business Checking',
      last4: '4521',
      isDefault: true,
    },
    {
      id: '2',
      type: 'card',
      name: 'Visa Business',
      last4: '8923',
      isDefault: false,
    },
  ];

  const notificationSettings = [
    { id: 'deposit_received', label: 'Deposit received', description: 'When funds are added to escrow', enabled: true },
    { id: 'release_requested', label: 'Release requested', description: 'When a contractor requests a release', enabled: true },
    { id: 'release_approved', label: 'Release approved', description: 'When you approve a release', enabled: true },
    { id: 'release_processed', label: 'Release processed', description: 'When funds are released to contractor', enabled: true },
    { id: 'statement_ready', label: 'Statement ready', description: 'When a new statement is available', enabled: false },
    { id: 'weekly_summary', label: 'Weekly summary', description: 'Weekly activity summary email', enabled: true },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-zinc-900">Settings</h1>
          <p className="text-zinc-600">Manage your payment methods, notifications, and account settings</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8">

          {/* Sidebar */}
          <nav className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-600'
                      : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1">

            {/* Payment Methods */}
            {activeTab === 'payment' && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">Payment Methods</h2>
                    <p className="text-sm text-zinc-600">Manage your bank accounts and cards</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition">
                    <Plus size={18} />
                    Add Method
                  </button>
                </div>

                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center">
                          {method.type === 'bank' ? (
                            <Building2 className="text-zinc-500" size={24} />
                          ) : (
                            <CreditCard className="text-zinc-500" size={24} />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-900">{method.name}</p>
                          <p className="text-sm text-zinc-500">•••• {method.last4}</p>
                        </div>
                        {method.isDefault && (
                          <span className="px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <button className="text-sm text-zinc-600 hover:text-zinc-900">
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-zinc-900">Notification Preferences</h2>
                  <p className="text-sm text-zinc-600">Choose which updates you want to receive</p>
                </div>

                <div className="space-y-4">
                  {notificationSettings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-zinc-900">{setting.label}</p>
                        <p className="text-sm text-zinc-500">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={setting.enabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-zinc-900">Security Settings</h2>
                  <p className="text-sm text-zinc-600">Manage your account security</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-zinc-900">Two-Factor Authentication</p>
                      <p className="text-sm text-zinc-500">Add an extra layer of security</p>
                    </div>
                    <span className="px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                      <Check size={14} />
                      Enabled
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-zinc-900">Change Password</p>
                      <p className="text-sm text-zinc-500">Last changed 45 days ago</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50">
                      Update
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-zinc-900">Login History</p>
                      <p className="text-sm text-zinc-500">View recent account activity</p>
                    </div>
                    <button className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50 flex items-center gap-1">
                      View
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-zinc-900">Release Approval PIN</p>
                      <p className="text-sm text-zinc-500">Require PIN for releases over $10,000</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Account */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-xl border border-zinc-200 p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-zinc-900">Account Information</h2>
                  <p className="text-sm text-zinc-600">Manage your account details</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        defaultValue="John Smith"
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue="john@example.com"
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        defaultValue="(202) 555-0123"
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Company</label>
                      <input
                        type="text"
                        defaultValue="Smith Construction LLC"
                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button className="px-4 py-2 text-sm font-semibold border border-zinc-200 rounded-lg hover:bg-zinc-50">
                      Cancel
                    </button>
                    <button className="px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
