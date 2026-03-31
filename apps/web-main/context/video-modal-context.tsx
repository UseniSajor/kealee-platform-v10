'use client'

import { createContext, useContext, useState, useCallback } from 'react'

export interface VideoConfig {
  tag: string
  title: string
  description: string
  thumbUrl: string
  videoUrl?: string
}

interface VideoModalCtx {
  isOpen: boolean
  config: VideoConfig | null
  openModal: (cfg: VideoConfig) => void
  closeModal: () => void
}

const Ctx = createContext<VideoModalCtx>({
  isOpen: false,
  config: null,
  openModal: () => {},
  closeModal: () => {},
})

export function VideoModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<VideoConfig | null>(null)

  const openModal = useCallback((cfg: VideoConfig) => {
    setConfig(cfg)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <Ctx.Provider value={{ isOpen, config, openModal, closeModal }}>
      {children}
    </Ctx.Provider>
  )
}

export const useVideoModal = () => useContext(Ctx)
