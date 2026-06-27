'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'kealee_ops_secret'

interface OpsAuthContextValue {
  secret: string
  setSecret: (s: string) => void
  headers: () => Record<string, string>
}

const OpsAuthContext = createContext<OpsAuthContextValue | null>(null)

export function OpsAuthProvider({ children }: { children: ReactNode }) {
  const [secret, setSecretState] = useState('')

  useEffect(() => {
    setSecretState(sessionStorage.getItem(STORAGE_KEY) ?? '')
  }, [])

  const setSecret = (s: string) => {
    sessionStorage.setItem(STORAGE_KEY, s)
    setSecretState(s)
  }

  const headers = (): Record<string, string> => (secret ? { 'x-kealee-ops': secret } : {})

  return (
    <OpsAuthContext.Provider value={{ secret, setSecret, headers }}>
      {children}
    </OpsAuthContext.Provider>
  )
}

export function useOpsAuth() {
  const ctx = useContext(OpsAuthContext)
  if (!ctx) throw new Error('useOpsAuth must be used within OpsAuthProvider')
  return ctx
}

export async function fetchIntelligenceApi<T>(path: string, secret: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-kealee-ops': secret,
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}
