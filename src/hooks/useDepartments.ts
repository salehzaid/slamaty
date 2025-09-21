import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { Department } from '@/types'

export function useDepartments(params?: { skip?: number; limit?: number }) {
  const [state, setState] = useState<{
    data: Department[]
    loading: boolean
    error: string | null
  }>({
    data: [],
    loading: true,
    error: null
  })

  const refetch = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      console.log('🔄 useDepartments: Fetching departments...')
      const response = await apiClient.getDepartments(params)
      console.log('📊 useDepartments: Raw response:', response)
      
      // Handle different response formats
      let data = []
      if (Array.isArray(response)) {
        data = response
      } else if (response && response.data && Array.isArray(response.data)) {
        data = response.data
      } else if (response && Array.isArray(response)) {
        data = response
      }
      
      console.log('📊 useDepartments: Processed data:', data)
      
      // Transform API data to match frontend interface
      const transformedData = data.map((dept: any) => ({
        id: dept.id,
        name: dept.name,
        nameEn: dept.name_en || dept.nameEn,
        code: dept.code,
        description: dept.description,
        location: dept.location,
        floor: dept.floor,
        building: dept.building,
        managers: dept.managers || [], // Include managers data
        isActive: dept.is_active !== undefined ? dept.is_active : true,
        createdAt: dept.created_at
      }))
      
      console.log('✅ useDepartments: Transformed data:', transformedData)
      setState(prev => ({ ...prev, data: transformedData, loading: false, error: null }))
    } catch (error) {
      console.error('❌ useDepartments: API call failed:', error)
      setState(prev => ({ ...prev, data: [], loading: false, error: 'فشل في تحميل الأقسام من قاعدة البيانات' }))
    }
  }

  // Load data on mount
  useEffect(() => {
    refetch()
  }, [params])

  return {
    ...state,
    refetch
  }
}
