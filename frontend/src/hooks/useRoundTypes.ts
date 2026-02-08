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

  // Helpers to map between camelCase and snake_case
  const mapToCamelCase = (data: any): RoundTypeSettings => ({
    id: data.id,
    name: data.name,
    nameEn: data.name_en,
    description: data.description,
    color: data.color,
    icon: data.icon,
    isActive: data.is_active,
    sortOrder: data.sort_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  })

  const mapToSnakeCase = (data: any) => ({
    name: data.name,
    name_en: data.nameEn,
    description: data.description,
    color: data.color,
    icon: data.icon,
    is_active: data.isActive,
    sort_order: data.sortOrder
  })

  const fetchRoundTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getRoundTypes()

      // Accept either an array response or an object with { success, data }
      let rawData: any[] = []
      if (Array.isArray(response)) {
        rawData = response
      } else if (response && response.data && Array.isArray(response.data)) {
        rawData = response.data
      }

      setRoundTypes(rawData.map(mapToCamelCase))
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
      const snakeData = mapToSnakeCase(data)
      const response = await apiClient.createRoundType(snakeData)

      const newRoundTypeRaw = response?.data || response
      if (newRoundTypeRaw && newRoundTypeRaw.id) {
        setRoundTypes(prev => [...prev, mapToCamelCase(newRoundTypeRaw)])
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
      const snakeData = mapToSnakeCase(data)
      // Remove undefined fields
      Object.keys(snakeData).forEach(key =>
        (snakeData as any)[key] === undefined && delete (snakeData as any)[key]
      )

      const response = await apiClient.updateRoundType(id, snakeData)
      const updatedRaw = response?.data || response
      if (updatedRaw) {
        setRoundTypes(prev =>
          prev.map(rt => rt.id === id ? mapToCamelCase(updatedRaw) : rt)
        )
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
      const isSuccess = response?.success || response?.message || response?.status === 'success' || response === true

      if (isSuccess || (response && !response.error)) {
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
