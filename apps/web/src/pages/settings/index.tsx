/**
 * Settings Index/Router Page
 * Main settings navigation
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import {
  CreditCard,
  User,
  Shield,
  Bell,
  Building2,
  Settings as SettingsIcon,
  ChevronRight,
  Lock,
  Smartphone,
} from 'lucide-react';

export function SettingsIndexPage() {
  const settingsSections = [
    {
      title: 'Payment Methods',
      description: 'Manage your cards and bank accounts',
      icon: CreditCard,
      href: '/settings/payment-methods',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Profile',
      description: 'Update your personal information',
      icon: User,
      href: '/settings/profile',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Security',
      description: 'Password and authentication settings',
      icon: Shield,
      href: '/settings/security',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Notifications',
      description: 'Email and push notification preferences',
      icon: Bell,
      href: '/settings/notifications',
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Organization',
      description: 'Manage your organization settings',
      icon: Building2,
      href: '/settings/organization',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Privacy',
      description: 'Data privacy and sharing preferences',
      icon: Lock,
      href: '/settings/privacy',
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Connected Devices',
      description: 'Manage devices and sessions',
      icon: Smartphone,
      href: '/settings/devices',
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'General',
      description: 'Language, timezone, and display preferences',
      icon: SettingsIcon,
      href: '/settings/general',
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <Link
            key={section.href}
            to={section.href}
            className="group"
          >
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${section.bgColor}`}>
                    <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default SettingsIndexPage;
