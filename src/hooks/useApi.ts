import { useState, useEffect } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await apiCall()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies) // Run when dependencies change

  return {
    ...state,
    refetch: fetchData,
  }
}

export function useApiMutation<T, P = any>(
  apiCall: (params: P) => Promise<T>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const mutate = async (params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await apiCall(params)
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  }

  return {
    ...state,
    mutate,
  }
}
