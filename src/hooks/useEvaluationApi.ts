import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

export interface EvaluationCategory {
  id: number
  name: string
  name_en?: string
  description?: string
  color: string
  icon: string
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

// Mock data for development
const mockCategories: EvaluationCategory[] = [
  {
    id: 1,
    name: 'الجودة',
    name_en: 'Quality',
    description: 'تصنيف معايير الجودة والتحسين المستمر',
    color: 'green',
    icon: 'check-circle',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'مكافحة العدوى',
    name_en: 'Infection Control',
    description: 'تصنيف معايير مكافحة العدوى والوقاية منها',
    color: 'red',
    icon: 'shield',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 3,
    name: 'سلامة المرضى',
    name_en: 'Patient Safety',
    description: 'تصنيف معايير سلامة المرضى والرعاية الآمنة',
    color: 'blue',
    icon: 'heart',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  }
]

const mockItems: EvaluationItem[] = [
  {
    id: 1,
    code: 'Q001',
    title: 'التحقق من هوية المريض',
    title_en: 'Patient Identity Verification',
    description: 'التأكد من التحقق من هوية المريض بشكل صحيح',
    objective: 'منع الأخطاء الطبية',
    category_id: 1,
    category_name: 'الجودة',
    category_color: 'green',
    is_active: true,
    is_required: true,
    weight: 5,
    risk_level: 'CRITICAL' as const,
    evidence_type: 'OBSERVATION' as const,
    guidance_ar: 'يجب التحقق من هوية المريض قبل أي إجراء طبي',
    guidance_en: 'Patient identity must be verified before any medical procedure',
    standard_version: '1.0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    code: 'IC001',
    title: 'غسل اليدين',
    title_en: 'Hand Hygiene',
    description: 'التأكد من تطبيق معايير غسل اليدين',
    objective: 'منع انتقال العدوى',
    category_id: 2,
    category_name: 'مكافحة العدوى',
    category_color: 'red',
    is_active: true,
    is_required: true,
    weight: 5,
    risk_level: 'CRITICAL' as const,
    evidence_type: 'OBSERVATION' as const,
    guidance_ar: 'يجب غسل اليدين قبل وبعد التعامل مع المرضى',
    guidance_en: 'Hands must be washed before and after patient contact',
    standard_version: '1.0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  }
]

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
      console.log('Loading categories from database...')
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
    } catch (err) {
      console.error('Failed to load categories from database:', err)
      setError('فشل في تحميل التصنيفات من قاعدة البيانات')
    } finally {
      setLoading(false)
    }
  }

  // Load items from API
  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading items from database...')
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
    } catch (err) {
      console.error('Failed to load items from database:', err)
      setError('فشل في تحميل العناصر من قاعدة البيانات')
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
      const response = await apiClient.updateEvaluationItem(id, itemData)
      const updatedItem = response.data || response
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
      return updatedItem
    } catch (err) {
      console.error('Failed to update item:', err)
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
    return items.filter(item => item.category_id === categoryId)
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
