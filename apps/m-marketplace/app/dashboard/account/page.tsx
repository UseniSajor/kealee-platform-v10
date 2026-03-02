'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProfile } from '@kealee/auth/client'
import { signOut } from '@kealee/auth/client'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  User,
  Mail,
  Phone,
  Save,
  LogOut,
  Lock,
  Building2,
  Bell,
  CreditCard,
  Package,
  ExternalLink,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface OrderSummary {
  id: string
  packageName: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export default function AccountPage() {
  const { profile, loading: authLoading, updateProfile } = useProfile()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: '',
  })
  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true,
    projectMilestones: true,
    marketingEmails: false,
  })

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/auth/login?redirect=/dashboard/account')
      return
    }
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: (profile as any).phone || '',
        company: (profile as any).company || '',
      })
    }
  }, [profile, authLoading, router])

  const fetchOrders = useCallback(async () => {
    if (!profile?.access_token) return
    try {
      const res = await fetch(`${API_URL}/api/orders?limit=5`, {
        headers: { Authorization: `Bearer ${profile.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch {
      // fail silently
    }
  }, [profile?.access_token])

  useEffect(() => {
    if (profile) fetchOrders()
  }, [profile, fetchOrders])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await updateProfile({ full_name: formData.full_name })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch {
      // ignore
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-sky-600" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Account Settings</h1>
        <p className="mt-1 text-gray-500">Manage your profile, notifications, and billing.</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Profile Information</h2>

        <div className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xl font-black">
              {formData.full_name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-bold text-gray-900">{formData.full_name || 'User'}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 555-5555"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition text-sm"
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Your company (optional)"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition text-sm"
              />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold text-sm transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Saving...
              </>
            ) : saved ? (
              <>
                <Save size={16} />
                Saved!
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-sky-600" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              key: 'orderUpdates' as const,
              label: 'Order Updates',
              desc: 'Get notified when your concept package status changes',
            },
            {
              key: 'projectMilestones' as const,
              label: 'Project Milestones',
              desc: 'Notifications for project phase changes and contractor updates',
            },
            {
              key: 'marketingEmails' as const,
              label: 'Product Updates & Tips',
              desc: 'Occasional emails about new features and construction tips',
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() =>
                  setNotifPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                }
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  notifPrefs[item.key] ? 'bg-sky-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifPrefs[item.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="text-sky-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Billing History</h2>
          </div>
          {orders.length > 0 && (
            <button
              onClick={() => router.push('/dashboard/orders')}
              className="text-sm text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              View all <ExternalLink size={14} />
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto text-gray-300 mb-3" size={32} />
            <p className="text-sm text-gray-500">No purchases yet</p>
            <button
              onClick={() => router.push('/pricing')}
              className="mt-3 text-sm text-sky-600 hover:underline font-semibold"
            >
              Browse packages
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition"
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.packageName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    ${(order.amount / 100).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Security</h2>
        <button
          onClick={() => router.push('/auth/forgot-password')}
          className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition w-full"
        >
          <Lock size={18} className="text-gray-400" />
          Change Password
        </button>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border-2 border-red-200 p-6">
        <h2 className="text-lg font-bold text-red-900 mb-2">Sign Out</h2>
        <p className="text-sm text-gray-500 mb-4">
          You&apos;ll need to log in again to access your account.
        </p>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
