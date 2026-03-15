'use client'

import { useState, useCallback } from 'react'

export type RoleSelectorContext = 'start-project' | 'join-marketplace' | 'general'

export function useRoleSelector() {
  const [isOpen,  setIsOpen]  = useState(false)
  const [context, setContext] = useState<RoleSelectorContext>('general')

  const open = useCallback((ctx: RoleSelectorContext = 'general') => {
    setContext(ctx)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  return { isOpen, context, open, close }
}
