import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

export interface ObjectiveOption {
  id: number
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EvaluationSettings {
  objectiveOptions: ObjectiveOption[]
}

export const useEvaluationSettings = () => {
  const [settings, setSettings] = useState<EvaluationSettings>({ objectiveOptions: [] })
  const [isLoading, setIsLoading] = useState(false)

  // Load settings from API on mount
  useEffect(() => {
    loadObjectiveOptions()
  }, [])

  const loadObjectiveOptions = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.request('/objective-options?active_only=false')
      setSettings({ objectiveOptions: response.data })
    } catch (error) {
      console.error('Failed to load objective options:', error)
      // Fallback to default options if API fails
      setSettings({
        objectiveOptions: [
          { id: 1, name: 'سباهي (CBAHI)', description: 'المعايير السعودية للرعاية الصحية', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 2, name: 'JCI', description: 'المعايير الدولية المشتركة', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 3, name: 'WHO Patient Safety Goals', description: 'أهداف السلامة للمرضى - منظمة الصحة العالمية', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 4, name: 'هدف داخلي للمستشفى', description: 'معايير محلية خاصة بالمستشفى', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addObjectiveOption = async (option: Omit<ObjectiveOption, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true)
      const response = await apiClient.request('/objective-options', {
        method: 'POST',
        body: JSON.stringify({
          name: option.name,
          description: option.description,
          is_active: option.is_active
        })
      })
      
      setSettings(prev => ({
        ...prev,
        objectiveOptions: [...prev.objectiveOptions, response.data],
      }))
      return response.data
    } catch (error) {
      console.error('Failed to add objective option:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateObjectiveOption = async (id: number, updates: Partial<ObjectiveOption>) => {
    try {
      setIsLoading(true)
      const response = await apiClient.request(`/objective-options/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updates.name,
          description: updates.description,
          is_active: updates.is_active
        })
      })
      
      setSettings(prev => ({
        ...prev,
        objectiveOptions: prev.objectiveOptions.map(option =>
          option.id === id ? response.data : option
        ),
      }))
      return response.data
    } catch (error) {
      console.error('Failed to update objective option:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteObjectiveOption = async (id: number) => {
    try {
      setIsLoading(true)
      await apiClient.request(`/objective-options/${id}`, { method: 'DELETE' })
      
      setSettings(prev => ({
        ...prev,
        objectiveOptions: prev.objectiveOptions.filter(option => option.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete objective option:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getActiveObjectiveOptions = () => {
    return settings.objectiveOptions.filter(option => option.is_active)
  }

  const updateSettings = (newSettings: Partial<EvaluationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  const saveSettings = async () => {
    // This function is now handled by individual CRUD operations
    return true
  }

  return {
    settings,
    isLoading,
    updateSettings,
    addObjectiveOption,
    updateObjectiveOption,
    deleteObjectiveOption,
    getActiveObjectiveOptions,
    saveSettings,
  }
}
