// packages/ui/src/components/Avatar.tsx
// Kealee Platform Avatar Component

import React from 'react';
import { cn } from '../lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Image source URL
   */
  src?: string;
  /**
   * Alt text for the image
   */
  alt?: string;
  /**
   * Fallback text (initials) if image fails to load
   */
  fallback?: string;
  /**
   * Size of the avatar
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Shape of the avatar
   */
  shape?: 'circle' | 'square';
  /**
   * Status indicator (online, offline, away)
   */
  status?: 'online' | 'offline' | 'away';
  /**
   * Click handler
   */
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
};

/**
 * Avatar component for displaying user profile pictures or initials
 * 
 * @example
 * ```tsx
 * <Avatar src="/user.jpg" alt="John Doe" />
 * <Avatar fallback="JD" />
 * <Avatar src="/user.jpg" status="online" size="lg" />
 * ```
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'Avatar',
      fallback,
      size = 'md',
      shape = 'circle',
      status,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false);
    const showImage = src && !imageError;

    const getInitials = (text: string): string => {
      return text
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const displayText = fallback ? getInitials(fallback) : '?';

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center',
          'bg-gray-200 text-gray-600',
          'font-semibold',
          'overflow-hidden',
          sizeClasses[size],
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            className={cn(
              'w-full h-full object-cover',
              shape === 'circle' ? 'rounded-full' : 'rounded-lg'
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="select-none">{displayText}</span>
        )}

        {/* Status indicator */}
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0',
              'w-3 h-3 rounded-full border-2 border-white',
              statusColors[status],
              size === 'sm' && 'w-2 h-2',
              size === 'xl' && 'w-4 h-4'
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
