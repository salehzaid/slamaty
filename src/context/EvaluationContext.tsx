import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface EvaluationCategory {
  id: number
  name: string
  color: string
  weight: number
  itemCount?: number
}

export interface EvaluationItem {
  id: number
  code: string
  title: string
  titleEn: string
  description: string
  objective: string
  categoryId: number
  categoryName: string
  categoryColor: string
  isActive: boolean
  isRequired: boolean
  weight: number
  riskLevel: 'MINOR' | 'MAJOR' | 'CRITICAL'
  evidenceType: 'OBSERVATION' | 'DOCUMENT' | 'INTERVIEW' | 'MEASUREMENT'
  guidanceAr: string
  guidanceEn: string
  standardVersion?: string
  createdAt: string
  updatedAt: string
}

interface EvaluationContextType {
  // Categories
  categories: EvaluationCategory[]
  addCategory: (category: Omit<EvaluationCategory, 'id'>) => void
  updateCategory: (id: number, category: Partial<EvaluationCategory>) => void
  deleteCategory: (id: number) => void

  // Items
  items: EvaluationItem[]
  addItem: (item: Omit<EvaluationItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateItem: (id: number, item: Partial<EvaluationItem>) => void
  deleteItem: (id: number) => void
  clearAllItems: () => void

  // Helper functions
  getItemsByCategory: (categoryId: number) => EvaluationItem[]
  getCategoryById: (id: number) => EvaluationCategory | undefined
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined)

// Initial data
const initialCategories: EvaluationCategory[] = [
  { id: 1, name: 'مكافحة العدوى', color: 'red', weight: 20 },
  { id: 2, name: 'سلامة المرضى', color: 'blue', weight: 25 },
  { id: 3, name: 'الجودة', color: 'green', weight: 15 },
  { id: 4, name: 'الأمن والسلامة', color: 'orange', weight: 15 },
  { id: 5, name: 'النظافة والتعقيم', color: 'purple', weight: 15 },
  { id: 6, name: 'سلامة الأدوية', color: 'cyan', weight: 10 }
]

const initialItems: EvaluationItem[] = []

export const EvaluationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load data from localStorage on initialization
  const loadCategories = (): EvaluationCategory[] => {
    try {
      const saved = localStorage.getItem('evaluation-categories')
      return saved ? JSON.parse(saved) : initialCategories
    } catch {
      return initialCategories
    }
  }

  const loadItems = (): EvaluationItem[] => {
    try {
      const saved = localStorage.getItem('evaluation-items')
      const items = saved ? JSON.parse(saved) : initialItems
      console.log('تم تحميل العناصر من localStorage:', items.length, 'عنصر')
      return items
    } catch (error) {
      console.error('خطأ في تحميل العناصر من localStorage:', error)
      return initialItems
    }
  }

  const [categories, setCategories] = useState<EvaluationCategory[]>(loadCategories)
  const [items, setItems] = useState<EvaluationItem[]>(loadItems)

  // Save to localStorage functions
  const saveCategories = (newCategories: EvaluationCategory[]) => {
    try {
      localStorage.setItem('evaluation-categories', JSON.stringify(newCategories))
    } catch (error) {
      console.error('Failed to save categories to localStorage:', error)
    }
  }

  const saveItems = (newItems: EvaluationItem[]) => {
    try {
      localStorage.setItem('evaluation-items', JSON.stringify(newItems))
    } catch (error) {
      console.error('Failed to save items to localStorage:', error)
    }
  }

  const addCategory = (category: Omit<EvaluationCategory, 'id'>) => {
    const newCategory: EvaluationCategory = {
      ...category,
      id: Date.now()
    }
    setCategories(prev => {
      const newCategories = [...prev, newCategory]
      saveCategories(newCategories)
      return newCategories
    })
  }

  const updateCategory = (id: number, category: Partial<EvaluationCategory>) => {
    setCategories(prev => {
      const newCategories = prev.map(cat =>
        cat.id === id ? { ...cat, ...category } : cat
      )
      saveCategories(newCategories)
      return newCategories
    })
  }

  const deleteCategory = (id: number) => {
    setCategories(prev => {
      const newCategories = prev.filter(cat => cat.id !== id)
      saveCategories(newCategories)
      return newCategories
    })
    // Also remove items associated with this category
    setItems(prev => {
      const newItems = prev.filter(item => item.categoryId !== id)
      saveItems(newItems)
      return newItems
    })
  }

  const addItem = (item: Omit<EvaluationItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const category = categories.find(cat => cat.id === item.categoryId)
    if (!category) {
      throw new Error('Category not found')
    }

    const newItem: EvaluationItem = {
      ...item,
      id: Date.now(),
      categoryName: category.name,
      categoryColor: category.color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setItems(prev => {
      const newItems = [...prev, newItem]
      saveItems(newItems)
      console.log('تم إضافة عنصر جديد:', newItem)
      console.log('إجمالي العناصر:', newItems.length)
      return newItems
    })
  }

  const updateItem = (id: number, item: Partial<EvaluationItem>) => {
    setItems(prev => {
      const newItems = prev.map(existingItem => {
        if (existingItem.id === id) {
          const updatedItem = { ...existingItem, ...item }
          // Update category info if categoryId changed
          if (item.categoryId) {
            const category = categories.find(cat => cat.id === item.categoryId)
            if (category) {
              updatedItem.categoryName = category.name
              updatedItem.categoryColor = category.color
            }
          }
          updatedItem.updatedAt = new Date().toISOString()
          return updatedItem
        }
        return existingItem
      })
      saveItems(newItems)
      return newItems
    })
  }

  const deleteItem = (id: number) => {
    setItems(prev => {
      const newItems = prev.filter(item => item.id !== id)
      saveItems(newItems)
      return newItems
    })
  }

  const clearAllItems = () => {
    setItems([])
    saveItems([])
  }

  const getItemsByCategory = (categoryId: number) => {
    return items.filter(item => item.categoryId === categoryId)
  }

  const getCategoryById = (id: number) => {
    return categories.find(cat => cat.id === id)
  }

  const value: EvaluationContextType = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    items,
    addItem,
    updateItem,
    deleteItem,
    clearAllItems,
    getItemsByCategory,
    getCategoryById
  }

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  )
}

export const useEvaluation = () => {
  const context = useContext(EvaluationContext)
  if (context === undefined) {
    throw new Error('useEvaluation must be used within an EvaluationProvider')
  }
  return context
}
