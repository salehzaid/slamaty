import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

export interface NotificationSettings {
  id?: number
  user_id: number
  email_notifications: boolean
  sms_notifications: boolean
  round_assignments: boolean
  round_reminders: boolean
  round_deadlines: boolean
  capa_assignments: boolean
  capa_deadlines: boolean
  system_updates: boolean
  weekly_reports: boolean
  created_at?: string
  updated_at?: string
}

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.get('/api/notification-settings')
      setSettings(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load notification settings')
      console.error('Error loading notification settings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (updates: Partial<NotificationSettings>) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.put('/api/notification-settings', updates)
      setSettings(response.data)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update notification settings')
      console.error('Error updating notification settings:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const saveSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    return await updateSettings(newSettings)
  }, [updateSettings])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    isLoading,
    error,
    loadSettings,
    updateSettings,
    saveSettings
  }
}
