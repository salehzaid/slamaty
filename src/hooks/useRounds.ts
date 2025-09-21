import { useState, useEffect } from 'react'
import { useApiMutation } from './useApi'
import { apiClient } from '@/lib/api'
import { Round } from '@/types'

// All data comes from API - no mock data

export function useRounds(params?: { skip?: number; limit?: number }) {
  const [state, setState] = useState<{
    data: Round[]
    loading: boolean
    error: string | null
  }>({
    data: [],
    loading: true,
    error: null
  })

  const refetch = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const response = await apiClient.getRounds(params)
      
      // Backend returns data directly as array, not wrapped in response object
      const data = Array.isArray(response) ? response : (response?.data || response || [])
      
      // Transform API data to match frontend interface
      const transformedData = Array.isArray(data) ? data.map((round: any) => ({
        id: round.id,
        roundCode: round.round_code,
        title: round.title,
        description: round.description,
        roundType: round.round_type,
        department: round.department,
        assignedTo: round.assigned_to ? JSON.parse(round.assigned_to) : [],
        scheduledDate: round.scheduled_date,
        status: round.status,
        priority: round.priority,
        compliancePercentage: round.compliance_percentage || 0,
        notes: round.notes,
        createdBy: round.created_by_id ? `مستخدم ${round.created_by_id}` : 'غير محدد',
        createdAt: round.created_at
      })) : []
      
      console.log('Rounds data loaded:', transformedData.length, 'rounds')
      setState(prev => ({ ...prev, data: transformedData, loading: false, error: null }))
    } catch (error) {
      console.error('API call failed:', error)
      setState(prev => ({ ...prev, data: [], loading: false, error: 'فشل في تحميل البيانات من قاعدة البيانات' }))
    }
  }

  // Load data on mount
  useEffect(() => {
    refetch()
  }, [])

  return {
    ...state,
    refetch
  }
}

export function useMyRounds(params?: { skip?: number; limit?: number }) {
  const [state, setState] = useState<{
    data: Round[]
    loading: boolean
    error: string | null
  }>({
    data: [],
    loading: true,
    error: null
  })

  const refetch = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      console.log('🔍 Fetching my rounds...')
      const response = await apiClient.getMyRounds(params)
      console.log('📥 My rounds response:', response)
      
      const data = Array.isArray(response) ? response : (response.data || [])
      console.log('📊 My rounds data:', data)
      
      // Transform API data to match frontend interface
      const transformedData = Array.isArray(data) ? data.map((round: any) => ({
        id: round.id,
        roundCode: round.round_code,
        title: round.title,
        description: round.description,
        roundType: round.round_type,
        department: round.department,
        assignedTo: round.assigned_to ? JSON.parse(round.assigned_to) : [],
        scheduledDate: round.scheduled_date,
        status: round.status,
        priority: round.priority,
        compliancePercentage: round.compliance_percentage || 0,
        notes: round.notes,
        createdBy: round.created_by_id ? `مستخدم ${round.created_by_id}` : 'غير محدد',
        createdAt: round.created_at
      })) : []
      
      console.log('✅ Transformed my rounds data:', transformedData)
      setState(prev => ({ ...prev, data: transformedData, loading: false, error: null }))
    } catch (error) {
      console.error('❌ My rounds API call failed:', error)
      setState(prev => ({ ...prev, data: [], loading: false, error: 'فشل في تحميل البيانات من قاعدة البيانات' }))
    }
  }

  // Load data on mount
  useEffect(() => {
    refetch()
  }, [])

  return {
    ...state,
    refetch
  }
}

export function useCreateRound() {
  // Bind the method to apiClient so `this` inside the method refers to apiClient
  return useApiMutation<any, any>(apiClient.createRound.bind(apiClient))
}

export function useUpdateRound() {
  return useApiMutation<any, { id: number; data: any }>(
    ({ id, data }) => apiClient.updateRound(id, data)
  )
}

export function useDeleteRound() {
  // Bind the method to apiClient so `this.request` is available inside deleteRound
  return useApiMutation<any, number>(apiClient.deleteRound.bind(apiClient))
}
