"use client"

import axios, { AxiosError, type AxiosInstance } from "axios"
import { getClerkToken } from '@/lib/clerk-token'

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

async function getToken(): Promise<string | null> {
  return getClerkToken()
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
        redirectToLogin()
      }

      throw new ApiError(message, { status, code: payload?.code, details: payload?.details })
    }
  )

  return instance
}

export const apiClient = createApiClient()
