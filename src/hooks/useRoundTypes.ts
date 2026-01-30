import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { RoundTypeSettings } from '@/types'

interface UseRoundTypesReturn {
  roundTypes: RoundTypeSettings[]
  loading: boolean
  error: string | null
  createRoundType: (data: Omit<RoundTypeSettings, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRoundType: (id: number, data: Partial<RoundTypeSettings>) => Promise<void>
  deleteRoundType: (id: number) => Promise<void>
  refetch: () => Promise<void>
}

export const useRoundTypes = (): UseRoundTypesReturn => {
  const [roundTypes, setRoundTypes] = useState<RoundTypeSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoundTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getRoundTypes()

      // Accept either an array response or an object with { success, data }
      if (Array.isArray(response)) {
        setRoundTypes(response)
      } else if (response && typeof response === 'object') {
        if (response.success && Array.isArray(response.data)) {
          setRoundTypes(response.data)
        } else if (Array.isArray(response.data)) {
          setRoundTypes(response.data)
        } else {
          setError('فشل في جلب أنواع الجولات')
        }
      } else {
        setError('فشل في جلب أنواع الجولات')
      }
    } catch (err) {
      console.error('Error fetching round types:', err)
      setError(err instanceof Error ? err.message : 'خطأ في جلب أنواع الجولات')
    } finally {
      setLoading(false)
    }
  }

  const createRoundType = async (data: Omit<RoundTypeSettings, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const response = await apiClient.createRoundType(data)

      // The API client returns raw data if not wrapped in { data: ... }
      // If response has an id, it's a success
      const newRoundType = response.data || response

      if (newRoundType && newRoundType.id) {
        setRoundTypes(prev => [...prev, newRoundType])
        // Refetch to ensure everything is in sync and ordered correctly
        fetchRoundTypes()
      } else {
        throw new Error('فشل في إنشاء نوع الجولة')
      }
    } catch (err) {
      console.error('Error creating round type:', err)
      setError(err instanceof Error ? err.message : 'خطأ في إنشاء نوع الجولة')
      throw err
    }
  }

  const updateRoundType = async (id: number, data: Partial<RoundTypeSettings>) => {
    try {
      setError(null)
      const response = await apiClient.updateRoundType(id, data)

      const updatedData = response.data || response

      if (updatedData && (updatedData.id || response.message)) {
        setRoundTypes(prev =>
          prev.map(rt => rt.id === id ? { ...rt, ...updatedData } : rt)
        )
        // Refetch to ensure everything is in sync
        fetchRoundTypes()
      } else {
        throw new Error('فشل في تحديث نوع الجولة')
      }
    } catch (err) {
      console.error('Error updating round type:', err)
      setError(err instanceof Error ? err.message : 'خطأ في تحديث نوع الجولة')
      throw err
    }
  }

  const deleteRoundType = async (id: number) => {
    try {
      setError(null)
      const response = await apiClient.deleteRoundType(id)

      // Backend returns { message: "..." } or success object
      if (response && (response.message || response.success !== false)) {
        setRoundTypes(prev => prev.filter(rt => rt.id !== id))
      } else {
        throw new Error('فشل في حذف نوع الجولة')
      }
    } catch (err) {
      console.error('Error deleting round type:', err)
      setError(err instanceof Error ? err.message : 'خطأ في حذف نوع الجولة')
      throw err
    }
  }

  useEffect(() => {
    fetchRoundTypes()
  }, [])

  return {
    roundTypes,
    loading,
    error,
    createRoundType,
    updateRoundType,
    deleteRoundType,
    refetch: fetchRoundTypes
  }
}
