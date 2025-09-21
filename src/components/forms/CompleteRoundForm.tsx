import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, Building2, Shield, Heart, Droplets, Pill, Wrench, Leaf, Settings, Tag, Clock, Calendar, CheckCircle2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useDepartments } from '@/hooks/useDepartments'
import { useRoundTypes } from '@/hooks/useRoundTypes'

interface CompleteRoundFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: any // Add initial data for editing
  isEdit?: boolean // Flag to indicate if this is edit mode
}

const CompleteRoundForm: React.FC<CompleteRoundFormProps> = ({ onSubmit, onCancel, initialData, isEdit = false }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    round_type: initialData?.roundType || initialData?.round_type || '',
    department: initialData?.department || '', // Will be set from departments data
    scheduled_date: initialData?.scheduledDate ? new Date(initialData.scheduledDate).toISOString().split('T')[0] : '',
    deadline: initialData?.deadline || '7',
    priority: initialData?.priority || 'medium',
    selected_categories: initialData?.selected_categories || [] as number[],
    selected_items: initialData?.evaluation_items ? (Array.isArray(initialData.evaluation_items) ? initialData.evaluation_items : JSON.parse(initialData.evaluation_items)) : [] as number[],
    assigned_users: initialData?.assignedTo ? (Array.isArray(initialData.assignedTo) ? initialData.assignedTo : JSON.parse(initialData.assignedTo)) : [] as number[],
    notes: initialData?.notes || ''
  })

  const [roundCode] = useState(() => {
    if (isEdit && initialData?.roundCode) {
      return initialData.roundCode
    }
    return `RND-${Date.now().toString(36).toUpperCase()}`
  })

  const [users, setUsers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Use departments hook
  const { data: departments, loading: departmentsLoading, error: departmentsError } = useDepartments()
  
  // Use round types hook
  const { roundTypes, loading: roundTypesLoading, error: roundTypesError } = useRoundTypes()

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

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      try {
        const [u, c, it] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getEvaluationCategories(),
          apiClient.getEvaluationItems()
        ])
        if (!mounted) return
        
        
        // Handle API response structure
        const usersData = u?.data || u
        const categoriesData = c?.data || c
        const itemsData = it?.data || it
        
        setUsers(Array.isArray(usersData) ? usersData : [])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setItems(Array.isArray(itemsData) ? itemsData : [])
      } catch (err) {
        console.error('CompleteRoundForm fetch error', err)
        setUsers([])
        setCategories([])
        setItems([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchAll()
    return () => { mounted = false }
  }, [])

  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(items) || formData.selected_categories.length === 0) return []
    return items.filter(it => formData.selected_categories.includes(it.category_id))
  }, [items, formData.selected_categories])

  const toggleCategory = React.useCallback((id: number) => {
    setFormData(prev => {
      const isSelected = prev.selected_categories.includes(id)
      const newCategories = isSelected 
        ? prev.selected_categories.filter(x => x !== id)
        : [...prev.selected_categories, id]
      
      // If removing a category, remove only items from that category
      // If adding a category, keep all existing items
      let newItems = prev.selected_items
      if (isSelected) {
        // Remove items that belong to the deselected category
        newItems = prev.selected_items.filter(itemId => {
          const item = items.find(it => it.id === itemId)
          return item && item.category_id !== id
        })
      }
      
      return {
        ...prev,
        selected_categories: newCategories,
        selected_items: newItems
      }
    })
  }, [items])

  const toggleItem = React.useCallback((id: number) => {
    setFormData(prev => {
      const isSelected = prev.selected_items.includes(id)
      return {
        ...prev,
        selected_items: isSelected 
          ? prev.selected_items.filter(x => x !== id)
          : [...prev.selected_items, id]
      }
    })
  }, [])

  const toggleUser = React.useCallback((id: number) => {
    setFormData(prev => {
      const isSelected = prev.assigned_users.includes(id)
      return {
        ...prev,
        assigned_users: isSelected 
          ? prev.assigned_users.filter(x => x !== id)
          : [...prev.assigned_users, id]
      }
    })
  }, [])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      alert('يرجى إدخال عنوان الجولة')
      return
    }
    
    if (!formData.round_type) {
      alert('يرجى اختيار نوع الجولة')
      return
    }
    
    if (!formData.department) {
      alert('يرجى اختيار القسم')
      return
    }
    
    if (!formData.scheduled_date) {
      alert('يرجى اختيار التاريخ المجدول')
      return
    }
    
    if (formData.assigned_users.length === 0) {
      alert('يرجى اختيار مقيم واحد على الأقل')
      return
    }
    
    // Prepare payload - Backend expects assigned_to as array of user IDs
    const payload = {
      ...formData,
      round_code: roundCode,
      // convert display name to enum key expected by backend
      round_type: convertNameToEnum(formData.round_type),
      assigned_to: formData.assigned_users, // Send array of user IDs
      evaluation_items: formData.selected_items, // Send array of evaluation item IDs
      scheduled_date: formData.scheduled_date ? `${formData.scheduled_date}T10:00:00` : null // Convert date to datetime
    }
    
    console.log('CompleteRoundForm - Submitting payload:', payload)
    onSubmit(payload)
  }

  const evaluatorUsers = users.filter(u => {
    const role = u.role?.value || u.role // Handle both enum objects and strings
    return role === 'assessor' || role === 'super_admin' || role === 'quality_manager' || role === 'department_head'
  })
  

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'تعديل الجولة' : 'إنشاء جولة جديدة'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  رقم الجولة
                </Label>
                <div className="relative">
                  <Input 
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
                  ترميز تلقائي غير قابل للتعديل
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
              <p className="text-xs text-gray-400 mt-2">يمكن إضافة أنواع جديدة من صفحة الإعدادات</p>
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
              <p className="text-xs text-gray-400 mt-2">اختر القسم المراد تقييمه</p>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                العنوان
              </Label>
              <div className="relative">
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
                  required 
                  className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 pr-10"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Tag className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                الوصف
              </Label>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} 
                rows={3} 
                className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  التاريخ (المجدول)
                </Label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    type="date" 
                    value={formData.scheduled_date} 
                    onChange={e => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))} 
                    required 
                    className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 pr-10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  المهلة
                </Label>
                <Select value={formData.deadline} onValueChange={(value) => setFormData(prev => ({ ...prev, deadline: value }))}>
                  <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200">
                    <SelectValue placeholder="اختر المهلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3" className="py-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>3 أيام</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="5" className="py-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>5 أيام</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="7" className="py-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>أسبوع</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="14" className="py-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>أسبوعين</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                التصنيفات (اختر واحد أو أكثر)
              </Label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="mr-2 text-gray-600 text-sm">جاري التحميل...</span>
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <div 
                      key={c.id} 
                      className={`p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                        formData.selected_categories.includes(c.id) 
                          ? 'border-blue-500 bg-blue-50 shadow-md scale-105' 
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`} 
                      onClick={() => toggleCategory(c.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-100">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-xs">{c.name}</div>
                          <div className="text-xs text-gray-400 font-light">{c.description}</div>
                        </div>
                        {formData.selected_categories.includes(c.id) && (
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
            </div>

            {formData.selected_categories.length > 0 && (
              <div>
                <Label>عناصر التصنيفات (اختر واحد أو أكثر)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 max-h-56 overflow-y-auto">
                  {filteredItems.length === 0 ? <div className="text-sm text-gray-500 col-span-full">لا توجد عناصر للتصنيفات المختارة</div> : filteredItems.map(it => (
                    <div key={it.id} className={`p-3 border rounded cursor-pointer ${formData.selected_items.includes(it.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => toggleItem(it.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{it.title}</div>
                          <div className="text-sm text-gray-500">{it.description}</div>
                          <div className="text-xs text-gray-400 mt-1">{it.code}</div>
                        </div>
                        <div>{formData.selected_items.includes(it.id) ? <Badge>محدد</Badge> : null}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>الأولوية</Label>
              <div className="flex gap-2 mt-2">
                {['low','medium','high','urgent'].map(p => (
                  <button type="button" key={p} onClick={() => setFormData(prev => ({ ...prev, priority: p }))} className={`px-3 py-2 rounded border ${formData.priority===p? 'bg-blue-600 text-white' : 'bg-white'}`}>
                    {p === 'low' ? 'منخفضة' : p === 'medium' ? 'متوسطة' : p === 'high' ? 'عالية' : 'عاجلة'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>المقيمون (اختيار متعدد)</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded p-3">
                {loading ? (
                  <div className="text-sm text-gray-500">جاري التحميل...</div>
                ) : evaluatorUsers.length === 0 ? (
                  <div className="text-sm text-gray-500">لا يوجد مقيمون متاحون</div>
                ) : evaluatorUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 border rounded cursor-pointer hover:bg-gray-50" onClick={() => toggleUser(u.id)}>
                    <input 
                      type="checkbox" 
                      checked={formData.assigned_users.includes(u.id)} 
                      onChange={() => toggleUser(u.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium">{u.first_name} {u.last_name}</div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>تعليق للمقيمين</Label>
              <Textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-blue-600">{isEdit ? 'حفظ التغييرات' : 'إنشاء الجولة'}</Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">إلغاء</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompleteRoundForm


