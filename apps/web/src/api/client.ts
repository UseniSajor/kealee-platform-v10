/**
 * API Client Base Configuration
 * Axios instance with authentication and error handling
 */

import axios, { AxiosError, AxiosRequestConfig } from 'axios'

// API base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
})

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or your auth provider
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error: AxiosError) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      const data = error.response.data as any

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          break
        case 403:
          // Forbidden - show permission error
          console.error('Permission denied:', data.message)
          break
        case 404:
          // Not found
          console.error('Resource not found:', data.message)
          break
        case 500:
          // Server error
          console.error('Server error:', data.message)
          break
      }

      // Return structured error
      return Promise.reject({
        message: data.message || data.error || 'An error occurred',
        status,
        code: data.code,
        details: data.details,
      })
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: 'No response from server. Please check your connection.',
        status: 0,
      })
    } else {
      // Error in request setup
      return Promise.reject({
        message: error.message || 'Request failed',
        status: 0,
      })
    }
  }
)

// Helper function for GET requests
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.get(url, config)
}

// Helper function for POST requests
export async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.post(url, data, config)
}

// Helper function for PUT requests
export async function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.put(url, data, config)
}

// Helper function for DELETE requests
export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.delete(url, config)
}

// Helper function for PATCH requests
export async function patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return apiClient.patch(url, data, config)
}

export default apiClient

