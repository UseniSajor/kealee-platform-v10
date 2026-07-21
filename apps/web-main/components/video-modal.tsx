'use client'

import { useVideoModal } from '@/context/video-modal-context'

export function VideoModal() {
  const { isOpen, config, closeModal } = useVideoModal()

  if (!config) return null

  return (
    <div className={`modal-bg${isOpen ? ' open' : ''}`} onClick={closeModal}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="mclose" onClick={closeModal} aria-label="Close">×</button>
        <div className="mvid">
          {config.videoUrl ? (
            <video
              key={config.videoUrl}
              src={config.videoUrl}
              poster={config.thumbUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.thumbUrl} alt="" />
              <div className="mplay" aria-label="Play video">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </>
          )}
        </div>
        <div className="minfo">
          <div className="mtag">{config.tag}</div>
          <h3>{config.title}</h3>
          <p>{config.description}</p>
        </div>
      </div>
    </div>
  )
}
