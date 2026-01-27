import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { UserLoginForm, UserCreateForm } from '@/lib/validations'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.login(email, password)
      
      if (response.access_token) {
        // Store user data in localStorage with consistent key
        localStorage.setItem('sallamaty_user', JSON.stringify(response.user))
        localStorage.setItem('access_token', response.access_token)
        apiClient.setToken(response.access_token)
        return { success: true, user: response.user }
      } else {
        throw new Error('فشل في تسجيل الدخول')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (userData: UserCreateForm) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.register(userData)
      return { success: true, data: response }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء التسجيل'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    apiClient.clearToken()
    localStorage.removeItem('sallamaty_user')
    localStorage.removeItem('access_token')
  }, [])

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.getCurrentUser()
      return response
    } catch (err) {
      console.error('Failed to get current user:', err)
      return null
    }
  }, [])

  return {
    login,
    register,
    logout,
    getCurrentUser,
    loading,
    error,
  }
}
