import { getClerkToken } from '@/lib/clerk-token'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Get authentication token from Clerk session
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await getClerkToken()
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const token = await getAuthToken()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers,
      credentials: 'include',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`)
    }
    
    return response.json()
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const token = await getAuthToken()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`)
    }
    
    return response.json()
  },

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const token = await getAuthToken()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
      credentials: 'include',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`)
    }
    
    return response.json()
  },

  async delete<T>(endpoint: string): Promise<T> {
    const token = await getAuthToken()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error?.message || error.message || `HTTP ${response.status}`)
    }
    
    return response.json()
  },
}
