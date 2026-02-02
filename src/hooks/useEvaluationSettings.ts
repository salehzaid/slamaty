import { useState, useEffect, useMemo } from 'react'
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
  const [objectiveOptions, setObjectiveOptions] = useState<ObjectiveOption[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load settings from API on mount
  useEffect(() => {
    loadObjectiveOptions()
  }, [])

  const loadObjectiveOptions = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/objective-options?active_only=false')
      // Ensure we handle both { data: [...] } and [...] formats
      const rawData = response?.data || response
      // Normalizing data to ensure it's always an array before setting state
      const normalizedData = Array.isArray(rawData) ? rawData : []
      setObjectiveOptions(normalizedData)
    } catch (error) {
      console.error('Failed to load objective options:', error)
      // Fallback to default options if API fails
      setObjectiveOptions([
        { id: 1, name: 'سباهي (CBAHI)', description: 'المعايير السعودية للرعاية الصحية', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: 'JCI', description: 'المعايير الدولية المشتركة', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: 'WHO Patient Safety Goals', description: 'أهداف السلامة للمرضى - منظمة الصحة العالمية', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, name: 'هدف داخلي للمستشفى', description: 'معايير محلية خاصة بالمستشفى', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const addObjectiveOption = async (option: Omit<ObjectiveOption, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true)
      const response = await apiClient.post('/api/objective-options', {
        name: option.name,
        description: option.description,
        is_active: option.is_active
      })

      const newData = response?.data || response

      setObjectiveOptions(prev => [...(Array.isArray(prev) ? prev : []), newData])
      return newData
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
      const response = await apiClient.put(`/api/objective-options/${id}`, {
        name: updates.name,
        description: updates.description,
        is_active: updates.is_active
      })

      const updatedData = response?.data || response

      setObjectiveOptions(prev =>
        (Array.isArray(prev) ? prev : []).map(option =>
          option.id === id ? updatedData : option
        )
      )
      return updatedData
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
      await apiClient.delete(`/objective-options/${id}`)

      setObjectiveOptions(prev => (Array.isArray(prev) ? prev : []).filter(option => option.id !== id))
    } catch (error) {
      console.error('Failed to delete objective option:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const activeObjectiveOptions = useMemo(() => {
    // Defensive check to ensure we always return an array
    if (!Array.isArray(objectiveOptions)) return [];

    return objectiveOptions.filter(option => option?.is_active === true);
  }, [objectiveOptions]);

  const updateSettings = (newSettings: any) => {
    // For backward compatibility if needed, but not really used
    if (newSettings && newSettings.objectiveOptions) {
      const options = Array.isArray(newSettings.objectiveOptions) ? newSettings.objectiveOptions : []
      setObjectiveOptions(options)
    }
  }

  return {
    settings: { objectiveOptions }, // Backwards compatibility for the state object
    objectiveOptions,
    isLoading,
    updateSettings,
    addObjectiveOption,
    updateObjectiveOption,
    deleteObjectiveOption,
    activeObjectiveOptions,
    saveSettings: async () => true,
  }
}
