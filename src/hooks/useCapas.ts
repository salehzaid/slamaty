import { useApi, useApiMutation } from './useApi'
import { apiClient } from '@/lib/api'
import { Capa, CapaCreateForm } from '@/types'

// All data comes from database - no mock data

export function useCapas(params?: { skip?: number; limit?: number }) {
  return useApi(
    async () => {
      try {
        const response = await apiClient.getCapas(params)
        console.log('CAPAs response:', response)
        
        // Handle different response formats
        if (Array.isArray(response)) {
          return response
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data
        } else {
          console.log('No valid CAPAs data found')
          return []
        }
      } catch (error) {
        console.error('Failed to fetch CAPAs from database:', error)
        throw error
      }
    },
    [params?.skip, params?.limit]
  )
}

export function useCreateCapa() {
  return useApiMutation<Capa, CapaCreateForm>(apiClient.createCapa)
}

export function useUpdateCapa() {
  return useApiMutation<Capa, { id: number; data: Partial<CapaCreateForm> }>(
    ({ id, data }) => apiClient.updateCapa(id, data)
  )
}

export function useDeleteCapa() {
  return useApiMutation<void, number>(apiClient.deleteCapa)
}

export function useDeleteAllCapas() {
  return useApiMutation<void, void>(() => apiClient.deleteAllCapas())
}

export function useAllCapasUnfiltered(params?: { skip?: number; limit?: number }) {
  return useApi(
    async () => {
      try {
        const response = await apiClient.getAllCapasUnfiltered(params)
        console.log('All CAPAs (unfiltered) response:', response)
        
        // Handle different response formats
        if (Array.isArray(response)) {
          return response
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data
        } else {
          console.log('No valid unfiltered CAPAs data found')
          return []
        }
      } catch (error) {
        console.error('Failed to fetch all CAPAs (unfiltered) from database:', error)
        throw error
      }
    },
    [params?.skip, params?.limit]
  )
}
