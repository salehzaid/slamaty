import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

export interface EvaluationCategory {
  id: number
  name: string
  name_en?: string
  description?: string
  color: string
  icon: string
  weight_percent: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EvaluationItem {
  id: number
  code: string
  title: string
  title_en?: string
  description?: string
  objective?: string
  category_id: number
  category_ids?: number[]
  category_name: string
  category_color: string
  is_active: boolean
  is_required: boolean
  weight: number
  risk_level: 'MINOR' | 'MAJOR' | 'CRITICAL'
  evidence_type: 'OBSERVATION' | 'DOCUMENT' | 'INTERVIEW' | 'MEASUREMENT'
  guidance_ar?: string
  guidance_en?: string
  standard_version?: string
  created_at: string
  updated_at: string
}


// Mock data removed in favor of real API data


export const useEvaluationApi = () => {
  const [categories, setCategories] = useState<EvaluationCategory[]>([])
  const [items, setItems] = useState<EvaluationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load categories from API
  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      // تحديث الـ token قبل إرسال الطلب
      apiClient.refreshToken()

      console.log('Loading categories from database...')
      console.log('Current token:', localStorage.getItem('access_token') ? 'Token exists' : 'No token')

      const response = await apiClient.getEvaluationCategories()
      console.log('Categories response:', response)
      const categoriesData = response.data || response
      console.log('Setting categories:', categoriesData)

      // تأكد من أن البيانات صحيحة
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData)
      } else {
        console.error('Invalid categories data:', categoriesData)
        setError('بيانات التصنيفات غير صحيحة')
      }
    } catch (err: any) {
      console.error('Failed to load categories from database:', err)

      // التحقق من أخطاء التوثيق
      if (err.message?.includes('Authentication required') || err.message?.includes('403')) {
        setError('يجب تسجيل الدخول أولاً')
        // سيتم إعادة التوجيه تلقائياً بواسطة ApiClient
      } else {
        setError('فشل في تحميل التصنيفات من قاعدة البيانات')
      }
    } finally {
      setLoading(false)
    }
  }

  // Load items from API
  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)

      // تحديث الـ token قبل إرسال الطلب
      apiClient.refreshToken()

      console.log('Loading items from database...')
      console.log('Current token:', localStorage.getItem('access_token') ? 'Token exists' : 'No token')

      const response = await apiClient.getEvaluationItems()
      console.log('Items response:', response)
      const itemsData = response.data || response
      console.log('Setting items:', itemsData)

      // تأكد من أن البيانات صحيحة
      if (Array.isArray(itemsData)) {
        setItems(itemsData)
      } else {
        console.error('Invalid items data:', itemsData)
        setError('بيانات العناصر غير صحيحة')
      }
    } catch (err: any) {
      console.error('Failed to load items from database:', err)

      // التحقق من أخطاء التوثيق
      if (err.message?.includes('Authentication required') || err.message?.includes('403')) {
        setError('يجب تسجيل الدخول أولاً')
        // سيتم إعادة التوجيه تلقائياً بواسطة ApiClient
      } else {
        setError('فشل في تحميل العناصر من قاعدة البيانات')
      }
    } finally {
      setLoading(false)
    }
  }

  // Load all data on mount
  useEffect(() => {
    loadCategories()
    loadItems()
  }, [])

  // Force reload data
  const reloadData = () => {
    loadCategories()
    loadItems()
  }

  // Category operations
  const addCategory = async (categoryData: Omit<EvaluationCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.createEvaluationCategory(categoryData)
      const newCategory = response.data || response
      setCategories(prev => [...prev, newCategory])
      return newCategory
    } catch (err) {
      console.error('Failed to create category:', err)
      setError('فشل في إنشاء تصنيف التقييم')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateCategory = async (id: number, categoryData: Partial<EvaluationCategory>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.updateEvaluationCategory(id, categoryData)
      const updatedCategory = response.data || response
      setCategories(prev => prev.map(cat => cat.id === id ? updatedCategory : cat))
      return updatedCategory
    } catch (err) {
      console.error('Failed to update category:', err)
      setError('فشل في تحديث تصنيف التقييم')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      await apiClient.deleteEvaluationCategory(id)
      setCategories(prev => prev.filter(cat => cat.id !== id))
      // Also remove items associated with this category
      setItems(prev => prev.filter(item => item.category_id !== id))
    } catch (err) {
      console.error('Failed to delete category:', err)
      setError('فشل في حذف تصنيف التقييم')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Item operations
  const addItem = async (itemData: Omit<EvaluationItem, 'id' | 'created_at' | 'updated_at' | 'category_name' | 'category_color'>) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.createEvaluationItem(itemData)
      const newItem = response.data || response
      setItems(prev => [...prev, newItem])
      return newItem
    } catch (err) {
      console.error('Failed to create item:', err)
      setError('فشل في إنشاء عنصر التقييم')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (id: number, itemData: Partial<EvaluationItem>) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Updating item:', id)
      console.log('📤 Sending data:', itemData)

      const response = await apiClient.updateEvaluationItem(id, itemData)

      console.log('📥 Response:', response)

      const updatedItem = response.data || response
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))

      console.log('✅ Item updated successfully')

      return updatedItem
    } catch (err: any) {
      console.error('❌ Failed to update item:', err)
      console.error('❌ Error details:', err.message)
      console.error('❌ Error stack:', err.stack)
      setError('فشل في تحديث عنصر التقييم')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      await apiClient.deleteEvaluationItem(id)
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Failed to delete item:', err)
      setError('فشل في حذف عنصر التقييم')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const getItemsByCategory = (categoryId: number) => {
    return (Array.isArray(items) ? items : []).filter(item => item && item.category_id === categoryId)
  }

  const getCategoryById = (id: number) => {
    return categories.find(cat => cat.id === id)
  }

  const clearAllItems = async () => {
    // This would need to be implemented in the backend
    setItems([])
  }

  // New function to clear all data
  const clearAllData = () => {
    setCategories([])
    setItems([])
    setError(null)
    console.log('تم مسح جميع البيانات المحلية')
  }

  return {
    categories,
    items,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    clearAllItems,
    clearAllData,
    reloadData,
    getItemsByCategory,
    getCategoryById,
    loadCategories,
    loadItems
  }
}
