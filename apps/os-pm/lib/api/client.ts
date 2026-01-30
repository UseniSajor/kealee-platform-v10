"use client"

import axios, { AxiosError, type AxiosInstance } from "axios"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export type ApiErrorPayload = {
  message?: string
  error?: string
  code?: string
  details?: unknown
}

export class ApiError extends Error {
  status?: number
  code?: string
  details?: unknown

  constructor(message: string, opts?: { status?: number; code?: string; details?: unknown }) {
    super(message)
    this.name = "ApiError"
    this.status = opts?.status
    this.code = opts?.code
    this.details = opts?.details
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

let cachedToken: string | null = null
let tokenInit = false
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient()
  }
  return supabaseClient
}

async function ensureTokenCache() {
  if (tokenInit) return
  tokenInit = true

  const supabase = getSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  cachedToken = session?.access_token ?? null

  supabase.auth.onAuthStateChange((_event, session2) => {
    cachedToken = session2?.access_token ?? null
  })
}

async function getToken(): Promise<string | null> {
  await ensureTokenCache()
  return cachedToken
}

function redirectToLogin() {
  if (typeof window === "undefined") return
  // Preserve current location for redirect-back (optional).
  const next = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/login?next=${next}`
}

export function createApiClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30_000,
  })

  instance.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) {
      config.headers = config.headers ?? {}
      // Avoid `any`: support both plain-object headers and AxiosHeaders.
      if (typeof (config.headers as unknown as { set?: (k: string, v: string) => void }).set === "function") {
        ;(config.headers as unknown as { set: (k: string, v: string) => void }).set("Authorization", `Bearer ${token}`)
      } else {
        ;(config.headers as unknown as Record<string, string>).Authorization = `Bearer ${token}`
      }
    }
    return config
  })

  instance.interceptors.response.use(
    (resp) => resp,
    async (err: AxiosError<ApiErrorPayload>) => {
      const status = err.response?.status
      const payload = err.response?.data
      const message = payload?.message || payload?.error || err.message || "API request failed"

      if (status === 401) {
        try {
          await getSupabase().auth.signOut()
        } catch {
          // ignore
        }
        redirectToLogin()
      }

      throw new ApiError(message, { status, code: payload?.code, details: payload?.details })
    }
  )

  return instance
}

export const apiClient = createApiClient()

