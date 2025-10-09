import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, Users, AlertCircle, X, Plus, Shield, Heart, Droplets, Pill, Wrench, Leaf, Settings, Building2, Tag, Clock, CheckCircle2 } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { useRoundTypes } from '@/hooks/useRoundTypes'
import { apiClient } from '@/lib/api'

interface RoundFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: any // Add initial data for editing
  isEdit?: boolean // Flag to indicate if this is edit mode
}

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
}

interface Category {
  id: number
  name: string
  name_en: string
  color: string
  icon: string
  description: string
}

interface EvaluationItem {
  id: number
  title: string
  title_en: string
  code: string
  category_id: number
  description: string
  weight: number
  is_required: boolean
}


const RoundForm: React.FC<RoundFormProps> = ({ onSubmit, onCancel, initialData, isEdit = false }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    round_type: initialData?.roundType || initialData?.round_type || '',
    department: initialData?.department || '',
    scheduled_date: initialData?.scheduledDate ? new Date(initialData.scheduledDate).toISOString().split('T')[0] : '',
    deadline: initialData?.deadline || '',
    priority: initialData?.priority || 'medium',
    assigned_users: initialData?.assignedTo ? (Array.isArray(initialData.assignedTo) ? initialData.assignedTo : JSON.parse(initialData.assignedTo)) : [] as number[],
    selected_categories: initialData?.selected_categories || [] as number[],
    selected_items: initialData?.evaluation_items ? (Array.isArray(initialData.evaluation_items) ? initialData.evaluation_items : JSON.parse(initialData.evaluation_items)) : [] as number[],
    notes: initialData?.notes || ''
  })

  // Keep formData in sync when initialData (edit payload) arrives or users/items load
  useEffect(() => {
    if (!initialData) return

    const parseAssignedUsers = () => {
      const raw = initialData.assignedTo ?? initialData.assigned_to ?? initialData.assigned_to_json
      try {
        if (!raw) return []
        if (Array.isArray(raw)) {
          // If array of numbers -> use as IDs
          if (raw.length === 0) return []
          if (typeof raw[0] === 'number') return raw
          // If array of names, try map to user ids
          if (typeof raw[0] === 'string') {
            const mapped = raw.map((name: string) => {
              const parts = name.trim().split(/\s+/)
              const first = parts[0]
              const last = parts.slice(1).join(' ')
              const u = users.find((uu: any) => (uu.first_name + ' ' + uu.last_name).trim() === name.trim() || uu.email === name || uu.username === name)
              return u ? u.id : null
            }).filter(Boolean)
            return mapped
          }
        }
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : []
          } catch (err) {
            // maybe single name
            const u = users.find((uu: any) => (uu.first_name + ' ' + uu.last_name).trim() === raw.trim() || uu.email === raw || uu.username === raw)
            return u ? [u.id] : []
          }
        }
      } catch (err) {
        return []
      }
      return []
    }

    const parseSelectedItems = () => {
      const raw = initialData.evaluation_items ?? initialData.evaluationItems ?? initialData.evaluation_items_json
      try {
        if (!raw) return []
        if (Array.isArray(raw)) return raw.map((v: any) => typeof v === 'number' ? v : Number(v)).filter(Boolean)
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed.map((v: any) => typeof v === 'number' ? v : Number(v)).filter(Boolean) : []
          } catch (err) {
            // comma separated
            return raw.split(',').map(s => Number(s.trim())).filter(Boolean)
          }
        }
      } catch (err) {
        return []
      }
      return []
    }

    const parsedItems = parseSelectedItems()

    // derive categories from items if not explicitly provided
    const parsedCategories = initialData.selected_categories && initialData.selected_categories.length > 0
      ? initialData.selected_categories
      : (parsedItems && parsedItems.length > 0 ?
          Array.from(new Set(parsedItems.map((id: number) => {
            const it = evaluationItems.find(i => i.id === id)
            return it ? it.category_id : null
          }).filter(Boolean))) : [])

    setFormData(prev => ({
      ...prev,
      title: initialData.title ?? prev.title,
      description: initialData.description ?? prev.description,
      round_type: initialData.roundType ?? initialData.round_type ?? prev.round_type,
      department: initialData.department ?? prev.department,
      scheduled_date: initialData.scheduledDate ? new Date(initialData.scheduledDate).toISOString().split('T')[0] : (initialData.scheduled_date ? new Date(initialData.scheduled_date).toISOString().split('T')[0] : prev.scheduled_date),
      deadline: initialData.deadline ?? prev.deadline,
      priority: initialData.priority ?? prev.priority,
      assigned_users: parseAssignedUsers(),
      selected_categories: parsedCategories,
      selected_items: parsedItems,
      notes: initialData.notes ?? prev.notes
    }))
  }, [initialData, users, evaluationItems])

  // Data fetching - Use simple useState and useEffect
  const [users, setUsers] = useState<User[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [itemsError, setItemsError] = useState<string | null>(null)

  // Use departments hook
  const { data: departments, loading: departmentsLoading, error: departmentsError } = useDepartments()
  
  // Use round types hook
  const { roundTypes, loading: roundTypesLoading, error: roundTypesError } = useRoundTypes()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, categoriesData, itemsData] = await Promise.all([
          apiClient.getAssessors(),
          apiClient.getEvaluationCategories(),
          apiClient.getEvaluationItems()
        ])
        
        const normalizeUsers = (d: any) => {
          if (!d) return []
          if (Array.isArray(d)) return d
          if (d.data && Array.isArray(d.data)) return d.data
          if (d.data && d.data.users && Array.isArray(d.data.users)) return d.data.users
          if (d.users && Array.isArray(d.users)) return d.users
          return []
        }

        const normalizedUsers = normalizeUsers(usersData)
        setUsers(normalizedUsers)
        
        // 🔍 DEBUG: تحليل بنية بيانات المستخدمين
        console.log('🔍 Users API Response:', usersData)
        console.log('👥 Normalized Users:', normalizedUsers)
        console.log('👤 First User Sample:', normalizedUsers[0])
        console.log('📊 Users Count:', normalizedUsers.length)
        if (normalizedUsers.length > 0) {
          console.log('🔑 User Role Field Analysis:')
          normalizedUsers.slice(0, 3).forEach((user, index) => {
            console.log(`User ${index + 1}:`, {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              role: user.role,
              roleType: typeof user.role,
              allFields: Object.keys(user)
            })
          })
        }
        
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setEvaluationItems(Array.isArray(itemsData) ? itemsData : [])
      } catch (error) {
        console.error('Error fetching data:', error)
        setUsersError(error instanceof Error ? error.message : 'خطأ في جلب المستخدمين')
        setCategoriesError(error instanceof Error ? error.message : 'خطأ في جلب التصنيفات')
        setItemsError(error instanceof Error ? error.message : 'خطأ في جلب العناصر')
      } finally {
        setUsersLoading(false)
        setCategoriesLoading(false)
        setItemsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtered items based on selected categories
  const filteredItems = React.useMemo(() => {
    try {
      if (!evaluationItems || !Array.isArray(evaluationItems)) {
        return []
      }
      return evaluationItems.filter((item: EvaluationItem) => 
        formData.selected_categories.includes(item.category_id)
      )
    } catch (error) {
      console.error('Error filtering items:', error)
      return []
    }
  }, [evaluationItems, formData.selected_categories])

  // Get icon component for round type
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'shield': Shield,
      'alert-triangle': AlertCircle,
      'heart': Heart,
      'droplets': Droplets,
      'pill': Pill,
      'wrench': Wrench,
      'leaf': Leaf,
      'settings': Settings,
    }
    return iconMap[iconName] || Shield
  }

  // Convert a round type display name (Arabic or English) to backend enum key
  const convertNameToEnum = (name: string) => {
    if (!name) return name
    const normalized = name.trim()
    const map: { [key: string]: string } = {
      // English
      'Patient Safety': 'patient_safety',
      'Infection Control': 'infection_control',
      'Hygiene': 'hygiene',
      'Medication Safety': 'medication_safety',
      'Equipment Safety': 'equipment_safety',
      'Environmental': 'environmental',
      'General Hygiene': 'hygiene',
      'General': 'general',
      // Arabic - from database
      'جولة المتابعة': 'patient_safety',
      'جولة الإجراءات التصحيحية': 'infection_control',
      'جولة التقييم الشامل': 'medication_safety',
      'جولة التحقق السريع': 'equipment_safety',
      // Old Arabic names (keep for compatibility)
      'سلامة المرضى': 'patient_safety',
      'مكافحة العدوى': 'infection_control',
      'النظافة': 'hygiene',
      'سلامة الأدوية': 'medication_safety',
      'سلامة المعدات': 'equipment_safety',
      'البيئة': 'environmental',
      'النظافة العامة': 'hygiene',
      'عام': 'general'
    }
    if (map[normalized]) return map[normalized]
    return normalized.toLowerCase().replace(/\s+/g, '_')
  }

  // Deadline options
  const deadlineOptions = [
    { value: '3', label: '3 أيام' },
    { value: '5', label: '5 أيام' },
    { value: '7', label: 'أسبوع' },
    { value: '14', label: 'أسبوعين' }
  ]

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'منخفضة', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'متوسطة', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'عالية', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'عاجلة', color: 'bg-red-100 text-red-800' }
  ]


  const [roundCode] = useState(() => {
    if (isEdit && initialData?.roundCode) {
      return initialData.roundCode
    }
    const timestamp = Date.now().toString(36).toUpperCase()
    return `RND-${timestamp}`
  })

  // Handle form submission
  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      round_code: roundCode,
      // convert display name to enum key expected by backend
      round_type: convertNameToEnum(formData.round_type),
      assigned_to: formData.assigned_users, // Send user IDs directly
      evaluation_items: formData.selected_items // Add evaluation items
    }

    onSubmit(submitData)
  }, [formData, roundCode, onSubmit])

  // Handle category selection
  const handleCategoryToggle = React.useCallback((categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_categories: prev.selected_categories.includes(categoryId)
        ? prev.selected_categories.filter(id => id !== categoryId)
        : [...prev.selected_categories, categoryId],
      selected_items: [] // Reset items when categories change
    }))
  }, [])

  // Handle item selection
  const handleItemToggle = React.useCallback((itemId: number) => {
    try {
      setFormData(prev => ({
        ...prev,
        selected_items: prev.selected_items.includes(itemId)
          ? prev.selected_items.filter(id => id !== itemId)
          : [...prev.selected_items, itemId]
      }))
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }, [])

  // Handle user selection
  const handleUserToggle = React.useCallback((userId: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_users: prev.assigned_users.includes(userId)
        ? prev.assigned_users.filter(id => id !== userId)
        : [...prev.assigned_users, userId]
    }))
  }, [])

  // Get selected users names
  const getSelectedUsersNames = React.useCallback(() => {
    return formData.assigned_users.map(id => {
      const user = users?.find((u: User) => u.id === id)
      return user ? `${user.first_name} ${user.last_name}` : ''
    }).filter(Boolean)
  }, [formData.assigned_users, users])

  // Get selected categories names
  const getSelectedCategoriesNames = React.useCallback(() => {
    return formData.selected_categories.map(id => 
      categories?.find((c: Category) => c.id === id)?.name || ''
    ).filter(Boolean)
  }, [formData.selected_categories, categories])

  // Get selected items names
  const getSelectedItemsNames = React.useCallback(() => {
    try {
      if (!evaluationItems || !Array.isArray(evaluationItems)) {
        return []
      }
      return formData.selected_items.map(id => {
        const item = evaluationItems.find((item: EvaluationItem) => item.id === id)
        return item?.title || `عنصر ${id}`
      }).filter(Boolean)
    } catch (error) {
      console.error('Error getting selected items names:', error)
      return []
    }
  }, [formData.selected_items, evaluationItems])

  // Helper: robust assessor detection across different user shapes
  const isAssessor = React.useCallback((u: any) => {
    try {
      if (!u) return false
      const checkString = (s: any) => typeof s === 'string' && ['assessor', 'مقيم'].includes(s.trim().toLowerCase())

      // direct boolean flag
      if (u.is_assessor === true) return true

      // role field variations
      if (u.role) {
        if (typeof u.role === 'string') return checkString(u.role)
        if (Array.isArray(u.role)) return u.role.some(checkString)
        if (typeof u.role === 'object' && u.role !== null) {
          if (u.role.name && checkString(u.role.name)) return true
          if (u.role.key && checkString(u.role.key)) return true
        }
      }

      // roles array
      if (u.roles && Array.isArray(u.roles)) {
        return u.roles.some((r: any) => {
          if (!r) return false
          if (typeof r === 'string') return checkString(r)
          if (r.name && checkString(r.name)) return true
          if (r.key && checkString(r.key)) return true
          return false
        })
      }

      // nested profile
      if (u.profile) {
        if (u.profile.role && checkString(u.profile.role)) return true
        if (u.profile.roles && Array.isArray(u.profile.roles)) return u.profile.roles.some(checkString)
      }

      // permissions/flags
      if (u.permissions && Array.isArray(u.permissions)) {
        return u.permissions.some((p: any) => typeof p === 'string' && p.toLowerCase().includes('assess'))
      }

      return false
    } catch (err) {
      console.error('isAssessor check failed for user', u, err)
      return false
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-6 h-6" />
            {isEdit ? 'تعديل الجولة' : 'إنشاء جولة جديدة'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Round Code - Read Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="round_code" className="text-sm font-semibold text-gray-700 mb-2 block">
                  رقم الجولة
                </Label>
                <div className="relative">
                  <Input
                    id="round_code"
                    value={roundCode}
                    disabled
                    className="bg-gray-50 border-2 border-gray-200 h-12 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  يتم إنشاؤه تلقائياً
                </p>
              </div>
            </div>

            {/* Round Type - Single Row */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                نوع الجولة
              </Label>
              {roundTypesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="mr-2 text-gray-600 text-sm">جاري التحميل...</span>
                </div>
              ) : roundTypesError ? (
                <div className="flex items-center justify-center py-4 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>خطأ في التحميل</span>
                </div>
              ) : roundTypes && roundTypes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {roundTypes.map(type => {
                    const IconComponent = getIconComponent(type.icon)
                    return (
                      <div
                        key={type.id}
                        className={`p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                          formData.round_type === type.name
                            ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, round_type: type.name }))}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md bg-${type.color}-100`}>
                            <IconComponent className={`w-3 h-3 text-${type.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-xs">{type.name}</div>
                            {type.nameEn && (
                              <div className="text-xs text-gray-400 font-light">{type.nameEn}</div>
                            )}
                          </div>
                          {formData.round_type === type.name && (
                            <div className="p-0.5 rounded-full bg-blue-500">
                              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>لا توجد أنواع متاحة</span>
                </div>
              )}
            </div>

            {/* Department - Single Row */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                القسم
              </Label>
              {departmentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="mr-2 text-gray-600 text-sm">جاري التحميل...</span>
                </div>
              ) : departmentsError ? (
                <div className="flex items-center justify-center py-4 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>خطأ في التحميل</span>
                </div>
              ) : departments && departments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {departments.map(dept => (
                    <div
                      key={dept.id}
                      className={`p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                        formData.department === dept.name
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, department: dept.name }))}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-100">
                          <Building2 className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-xs">{dept.name}</div>
                          <div className="text-xs text-gray-400 font-light">{dept.code}</div>
                        </div>
                        {formData.department === dept.name && (
                          <div className="p-0.5 rounded-full bg-blue-500">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>لا توجد أقسام متاحة</span>
                </div>
              )}
            </div>

            {/* Title and Description */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
                  عنوان الجولة
                </Label>
                <div className="relative">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="أدخل عنوان الجولة"
                    required
                    className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Tag className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
                  وصف الجولة
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="أدخل وصف الجولة"
                  rows={3}
                  className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
            </div>

            {/* Date and Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="scheduled_date" className="text-sm font-semibold text-gray-700 mb-2 block">
                  التاريخ المجدول
                </Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    required
                    className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 pr-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700 mb-2 block">
                  المهلة
                </Label>
                <Select value={formData.deadline} onValueChange={React.useCallback((value) => setFormData(prev => ({ ...prev, deadline: value })), [])}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200">
                    <SelectValue placeholder="اختر المهلة" />
                  </SelectTrigger>
                  <SelectContent>
                    {deadlineOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="py-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                الأولوية
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {priorityOptions.map(option => (
                  <div
                    key={option.value}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.priority === option.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, priority: option.value }))}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${option.color.split(' ')[0]}`}></div>
                      <span className="text-sm font-semibold">{option.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories Selection */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                التصنيفات (اختر واحد أو أكثر)
              </Label>
              {categoriesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="mr-2 text-gray-600 text-sm">جاري التحميل...</span>
                </div>
              ) : categoriesError ? (
                <div className="flex items-center justify-center py-4 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>خطأ في التحميل</span>
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category: Category) => (
                    <div
                      key={category.id}
                      className={`p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                        formData.selected_categories.includes(category.id)
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleCategoryToggle(category.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md bg-${category.color}-100`}>
                          <div className={`w-3 h-3 rounded-full bg-${category.color}-500`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-xs">{category.name}</div>
                          <div className="text-xs text-gray-400 font-light">{category.description}</div>
                        </div>
                        {formData.selected_categories.includes(category.id) && (
                          <div className="p-0.5 rounded-full bg-blue-500">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>لا توجد تصنيفات متاحة</span>
                </div>
              )}
              
              {/* Selected Categories */}
              {formData.selected_categories.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium">التصنيفات المختارة:</p>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedCategoriesNames().map((name, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs px-2 py-1">
                        {name}
                        <X 
                          className="w-2.5 h-2.5 cursor-pointer hover:text-red-500" 
                          onClick={() => handleCategoryToggle(formData.selected_categories[index])}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Evaluation Items Selection */}
            {formData.selected_categories.length > 0 && (
              <div>
                <Label>عناصر التقييم</Label>
                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {itemsLoading ? (
                    <div className="text-center py-4 text-gray-500">جاري تحميل العناصر...</div>
                  ) : itemsError ? (
                    <div className="text-center py-4 text-red-500">خطأ في تحميل العناصر: {itemsError}</div>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item: EvaluationItem) => {
                      try {
                        if (!item || typeof item !== 'object') {
                          console.error('Invalid item:', item)
                          return null
                        }
                        return (
                          <div
                            key={item.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              formData.selected_items.includes(item.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleItemToggle(item.id)}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox 
                                checked={formData.selected_items.includes(item.id)}
                                onChange={() => handleItemToggle(item.id)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{item.title || 'عنصر بدون عنوان'}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {item.code || 'N/A'}
                                  </Badge>
                                  {item.is_required && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">
                                      مطلوب
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{item.description || 'لا يوجد وصف'}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>الوزن: {item.weight || 0}</span>
                                  <span>المستوى: {item.is_required ? 'مطلوب' : 'اختياري'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      } catch (error) {
                        console.error('Error rendering item:', item, error)
                        return null
                      }
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      اختر تصنيفات أولاً لعرض العناصر
                    </div>
                  )}
                </div>
                
                {/* Selected Items */}
                {formData.selected_items.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">العناصر المختارة ({formData.selected_items.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {getSelectedItemsNames().map((name, index) => {
                        try {
                          return (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {name}
                              <X 
                                className="w-3 h-3 cursor-pointer" 
                                onClick={() => handleItemToggle(formData.selected_items[index])}
                              />
                            </Badge>
                          )
                        } catch (error) {
                          console.error('Error rendering selected item badge:', error)
                          return null
                        }
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Assigned Users */}
            <div>
              <Label>المقيمون</Label>
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                {usersLoading ? (
                  <div className="text-center py-4 text-gray-500">جاري تحميل المستخدمين...</div>
                ) : usersError ? (
                  <div className="text-center py-4 text-red-500">خطأ في تحميل المستخدمين: {usersError}</div>
                ) : (
                  (() => {
                    const assessors = users?.filter((u: User) => isAssessor(u)) || []
                    console.log('🔍 Filter Analysis:')
                    console.log('Total users:', users?.length || 0)
                    console.log('Filtered assessors:', assessors.length)
                    console.log('Assessor details:', assessors.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, role: u.role })))
                    
                    if (users && users.length > 0) {
                      console.log('All users roles:', users.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}`, role: u.role })))
                    }
                    
                    return assessors.map((user: User) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.assigned_users.includes(user.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={formData.assigned_users.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                        />
                        <div>
                          <h4 className="font-medium">{user.first_name} {user.last_name}</h4>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {user.role === 'super_admin' ? 'مدير النظام' : 
                             user.role === 'assessor' ? 'مقيم' : 
                             user.role === 'quality_manager' ? 'مدير الجودة' :
                             user.role === 'department_head' ? 'رئيس القسم' : 'مشاهد'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                  })()
                )}
              </div>
              
              {/* Selected Users */}
              {formData.assigned_users.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">المقيمون المختارون:</p>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedUsersNames().map((name, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {name}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => handleUserToggle(formData.assigned_users[index])}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">تعليق للمقيمين</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أدخل تعليقات أو تعليمات للمقيمين"
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isEdit ? 'حفظ التغييرات' : 'إنشاء الجولة'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RoundForm