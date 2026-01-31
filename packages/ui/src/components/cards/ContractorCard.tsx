// packages/ui/src/components/cards/ContractorCard.tsx
// Contractor profile card for displaying contractor information

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Shield,
  Award,
  Briefcase,
  Clock,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type ContractorStatus = 'available' | 'busy' | 'unavailable' | 'pending_verification';

export interface ContractorSpecialty {
  name: string;
  yearsExperience?: number;
}

export interface ContractorCertification {
  name: string;
  issuer?: string;
  verified?: boolean;
}

export interface ContractorCardProps {
  id: string;
  name: string;
  companyName?: string;
  avatar?: string;
  coverImage?: string;
  status: ContractorStatus;
  rating?: number;
  reviewCount?: number;
  completedProjects?: number;
  activeProjects?: number;
  location?: string;
  phone?: string;
  email?: string;
  responseTime?: string;
  memberSince?: Date | string;
  specialties?: ContractorSpecialty[];
  certifications?: ContractorCertification[];
  isVerified?: boolean;
  isFeatured?: boolean;
  hourlyRate?: number;
  successRate?: number;
  bio?: string;
  href?: string;
  onClick?: () => void;
  onContact?: () => void;
  onInvite?: () => void;
  variant?: 'default' | 'compact' | 'profile';
  className?: string;
}

const statusConfig: Record<
  ContractorStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  available: {
    label: 'Available',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    dotColor: 'bg-green-500',
  },
  busy: {
    label: 'Busy',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    dotColor: 'bg-amber-500',
  },
  unavailable: {
    label: 'Unavailable',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    dotColor: 'bg-gray-400',
  },
  pending_verification: {
    label: 'Pending',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    dotColor: 'bg-blue-500',
  },
};

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function ContractorCard({
  id,
  name,
  companyName,
  avatar,
  coverImage,
  status,
  rating,
  reviewCount,
  completedProjects,
  activeProjects,
  location,
  phone,
  email,
  responseTime,
  memberSince,
  specialties,
  certifications,
  isVerified,
  isFeatured,
  hourlyRate,
  successRate,
  bio,
  href,
  onClick,
  onContact,
  onInvite,
  variant = 'default',
  className,
}: ContractorCardProps) {
  const statusInfo = statusConfig[status];

  const CardWrapper = href ? Link : 'div';
  const cardProps = href
    ? { href }
    : onClick
      ? { onClick, role: 'button', tabIndex: 0 }
      : {};

  // Compact variant
  if (variant === 'compact') {
    return (
      <CardWrapper
        {...(cardProps as any)}
        className={cn(
          'flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200',
          'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer',
          className
        )}
      >
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
              {name.charAt(0)}
            </div>
          )}
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white',
              statusInfo.dotColor
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
            {isVerified && (
              <Shield className="w-4 h-4 text-blue-500" />
            )}
          </div>
          {companyName && (
            <p className="text-sm text-gray-500 truncate">{companyName}</p>
          )}
        </div>

        {rating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
          </div>
        )}

        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            statusInfo.bgColor,
            statusInfo.color
          )}
        >
          {statusInfo.label}
        </span>

        <ChevronRight className="w-5 h-5 text-gray-400" />
      </CardWrapper>
    );
  }

  // Profile variant - full profile view
  if (variant === 'profile') {
    return (
      <div
        className={cn(
          'bg-white rounded-xl border border-gray-200 overflow-hidden',
          className
        )}
      >
        {/* Cover image */}
        <div className="relative h-32 bg-gradient-to-br from-orange-500 to-orange-600">
          {coverImage && (
            <img
              src={coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {isFeatured && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              <Award className="w-4 h-4" />
              Featured
            </div>
          )}
        </div>

        {/* Profile info */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-12 left-6">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg">
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="flex justify-end pt-4">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                statusInfo.bgColor,
                statusInfo.color
              )}
            >
              <span className={cn('w-2 h-2 rounded-full', statusInfo.dotColor)} />
              {statusInfo.label}
            </span>
          </div>

          {/* Name and company */}
          <div className="mt-8 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
              {isVerified && (
                <Shield className="w-5 h-5 text-blue-500" />
              )}
            </div>
            {companyName && (
              <p className="text-gray-600">{companyName}</p>
            )}
          </div>

          {/* Rating and stats */}
          <div className="flex items-center gap-6 mb-4">
            {rating !== undefined && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-5 h-5',
                        i < Math.floor(rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                {reviewCount !== undefined && (
                  <span className="text-gray-500">({reviewCount} reviews)</span>
                )}
              </div>
            )}
          </div>

          {/* Bio */}
          {bio && (
            <p className="text-gray-600 mb-4">{bio}</p>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {completedProjects !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Briefcase className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-gray-900">{completedProjects}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            )}
            {activeProjects !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-gray-900">{activeProjects}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            )}
            {successRate !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-gray-900">{successRate}%</div>
                <div className="text-xs text-gray-500">Success</div>
              </div>
            )}
            {responseTime && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-gray-900">{responseTime}</div>
                <div className="text-xs text-gray-500">Response</div>
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-2 mb-6">
            {location && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                {location}
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {email}
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {phone}
              </div>
            )}
            {memberSince && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                Member since {formatDate(memberSince)}
              </div>
            )}
          </div>

          {/* Specialties */}
          {specialties && specialties.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                  >
                    {specialty.name}
                    {specialty.yearsExperience && (
                      <span className="text-orange-500 ml-1">
                        ({specialty.yearsExperience}y)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Certifications</h3>
              <div className="space-y-2">
                {certifications.map((cert, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {cert.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-gray-700">{cert.name}</span>
                    {cert.issuer && (
                      <span className="text-gray-500 text-sm">- {cert.issuer}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {onContact && (
              <button
                onClick={onContact}
                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Contact
              </button>
            )}
            {onInvite && (
              <button
                onClick={onInvite}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Invite to Bid
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <CardWrapper
      {...(cardProps as any)}
      className={cn(
        'block bg-white rounded-xl border border-gray-200 p-5',
        'hover:shadow-lg hover:border-gray-300 transition-all',
        onClick || href ? 'cursor-pointer' : '',
        isFeatured && 'ring-2 ring-amber-400 ring-offset-2',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
              {name.charAt(0)}
            </div>
          )}
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white',
              statusInfo.dotColor
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{name}</h3>
            {isVerified && (
              <Shield className="w-4 h-4 text-blue-500" />
            )}
            {isFeatured && (
              <Award className="w-4 h-4 text-amber-500" />
            )}
          </div>
          {companyName && (
            <p className="text-sm text-gray-500">{companyName}</p>
          )}
          {location && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3" />
              {location}
            </div>
          )}
        </div>

        <span
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium',
            statusInfo.bgColor,
            statusInfo.color
          )}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Rating */}
      {rating !== undefined && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < Math.floor(rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
          {reviewCount !== undefined && (
            <span className="text-sm text-gray-500">({reviewCount})</span>
          )}
        </div>
      )}

      {/* Specialties */}
      {specialties && specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {specialties.slice(0, 3).map((specialty, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {specialty.name}
            </span>
          ))}
          {specialties.length > 3 && (
            <span className="px-2 py-0.5 text-gray-400 text-xs">
              +{specialties.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {completedProjects !== undefined && (
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{completedProjects}</div>
            <div className="text-xs text-gray-500">Projects</div>
          </div>
        )}
        {successRate !== undefined && (
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{successRate}%</div>
            <div className="text-xs text-gray-500">Success</div>
          </div>
        )}
        {responseTime && (
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{responseTime}</div>
            <div className="text-xs text-gray-500">Response</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {hourlyRate !== undefined && (
          <div className="text-sm">
            <span className="text-gray-500">From </span>
            <span className="font-semibold text-gray-900">${hourlyRate}/hr</span>
          </div>
        )}
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </CardWrapper>
  );
}

export default ContractorCard;
