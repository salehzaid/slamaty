import { useCallback } from 'react'
import { toast } from 'sonner'

interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

export const useErrorHandler = () => {
  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      fallbackMessage = 'حدث خطأ غير متوقع'
    } = options

    // Extract error message
    let errorMessage = fallbackMessage
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as any).message
    }

    // Log error to console
    if (logError) {
      console.error('Error handled:', error)
    }

    // Show toast notification
    if (showToast) {
      toast.error(errorMessage)
    }

    return errorMessage
  }, [])

  const handleApiError = useCallback((
    error: any,
    options: ErrorHandlerOptions = {}
  ) => {
    let errorMessage = options.fallbackMessage || 'فشل في الاتصال بالخادم'

    // Handle different types of API errors
    if (error?.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.message) {
      errorMessage = error.message
    } else if (error?.response?.status) {
      switch (error.response.status) {
        case 400:
          errorMessage = 'طلب غير صحيح'
          break
        case 401:
          errorMessage = 'غير مصرح بالوصول'
          break
        case 403:
          errorMessage = 'ممنوع الوصول'
          break
        case 404:
          errorMessage = 'المورد غير موجود'
          break
        case 500:
          errorMessage = 'خطأ في الخادم'
          break
        default:
          errorMessage = `خطأ في الخادم (${error.response.status})`
      }
    }

    return handleError(errorMessage, options)
  }, [handleError])

  const handleNetworkError = useCallback((
    error: any,
    options: ErrorHandlerOptions = {}
  ) => {
    const errorMessage = options.fallbackMessage || 'فشل في الاتصال بالشبكة'
    return handleError(errorMessage, options)
  }, [handleError])

  const handleValidationError = useCallback((
    error: any,
    options: ErrorHandlerOptions = {}
  ) => {
    let errorMessage = options.fallbackMessage || 'بيانات غير صحيحة'

    if (error?.response?.data?.detail) {
      if (Array.isArray(error.response.data.detail)) {
        errorMessage = error.response.data.detail
          .map((err: any) => err.msg || err.message || err)
          .join(', ')
      } else {
        errorMessage = error.response.data.detail
      }
    }

    return handleError(errorMessage, options)
  }, [handleError])

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError
  }
}
