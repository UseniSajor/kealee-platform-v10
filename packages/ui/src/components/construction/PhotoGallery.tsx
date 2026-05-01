// packages/ui/src/components/construction/PhotoGallery.tsx
// Construction site photo gallery with GPS tagging and categories

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Camera, MapPin, Calendar, Tag, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export interface SitePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  category?: string;
  takenAt?: Date | string;
  location?: string;
  uploaderName?: string;
}

export interface PhotoGalleryProps {
  photos: SitePhoto[];
  title?: string;
  columns?: 2 | 3 | 4;
  onUpload?: () => void;
  className?: string;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PhotoGallery({
  photos,
  title = 'Site Photos',
  columns = 3,
  onUpload,
  className,
}: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const open = (i: number) => setLightboxIndex(i);
  const close = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : photos.length - 1));
  const next = () => setLightboxIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : 0));

  const colClass = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[columns];

  return (
    <>
      <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{photos.length}</span>
          </div>
          {onUpload && (
            <button
              onClick={onUpload}
              className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              Add Photos
            </button>
          )}
        </div>

        {/* Grid */}
        {photos.length > 0 ? (
          <div className={cn('grid gap-2 p-3', colClass)}>
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => open(i)}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
              >
                <img
                  src={photo.thumbnailUrl ?? photo.url}
                  alt={photo.caption ?? `Site photo ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
                {/* Category tag */}
                {photo.category && (
                  <div className="absolute bottom-1.5 left-1.5">
                    <span className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {photo.category}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No photos yet</p>
            {onUpload && (
              <button onClick={onUpload} className="text-xs text-primary-600 hover:underline mt-1">
                Upload the first photo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={close}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Image */}
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].caption ?? `Photo ${lightboxIndex + 1}`}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />

            {/* Close */}
            <button
              onClick={close}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Prev / Next */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-300">
              {photos[lightboxIndex].caption && (
                <span className="text-white font-medium">{photos[lightboxIndex].caption}</span>
              )}
              {photos[lightboxIndex].takenAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(photos[lightboxIndex].takenAt!)}
                </div>
              )}
              {photos[lightboxIndex].location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {photos[lightboxIndex].location}
                </div>
              )}
              {photos[lightboxIndex].category && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {photos[lightboxIndex].category}
                </div>
              )}
              <span className="ml-auto">
                {lightboxIndex + 1} / {photos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
