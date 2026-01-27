import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Filter, 
  Search, 
  X, 
  Save, 
  Loader2,
  Calendar,
  Users,
  Building2,
  Target,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  Plus,
  Trash2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'

interface FilterConfig {
  id: string
  name: string
  description: string
  filters: FilterItem[]
  created_at: string
  updated_at: string
  created_by: string
  is_public: boolean
  usage_count: number
}

interface FilterItem {
  id: string
  field: string
  label: string
  type: 'text' | 'select' | 'multi_select' | 'date_range' | 'number_range' | 'boolean' | 'autocomplete'
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in'
  value: any
  options?: string[]
  required: boolean
  placeholder?: string
}

interface AdvancedFiltersProps {
  entityType: 'capa' | 'round' | 'user' | 'department'
  onFiltersChange: (filters: FilterItem[]) => void
  initialFilters?: FilterItem[]
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  entityType,
  onFiltersChange,
  initialFilters = []
}) => {
  const [filters, setFilters] = useState<FilterItem[]>(initialFilters)
  const [savedConfigs, setSavedConfigs] = useState<FilterConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<FilterConfig | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSavedConfigs, setShowSavedConfigs] = useState(false)

  const fetchSavedConfigs = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.request(`/api/filters/configs/${entityType}/`)
      const data = response.data || response
      setSavedConfigs(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch saved filter configs:', err)
      setError('فشل في تحميل إعدادات الفلاتر المحفوظة')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSavedConfigs()
  }, [entityType])

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const addFilter = () => {
    const newFilter: FilterItem = {
      id: Date.now().toString(),
      field: '',
      label: '',
      type: 'text',
      operator: 'equals',
      value: '',
      required: false
    }

    setFilters(prev => [...prev, newFilter])
  }

  const updateFilter = (filterId: string, updates: Partial<FilterItem>) => {
    setFilters(prev => 
      prev.map(filter => 
        filter.id === filterId 
          ? { ...filter, ...updates }
          : filter
      )
    )
  }

  const removeFilter = (filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId))
  }

  const clearAllFilters = () => {
    setFilters([])
  }

  const saveConfig = async (name: string, description: string) => {
    try {
      const config: Omit<FilterConfig, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'usage_count'> = {
        name,
        description,
        filters,
        is_public: false
      }

      const response = await apiClient.request(`/api/filters/configs/${entityType}/`, {
        method: 'POST',
        body: JSON.stringify(config)
      })

      setSavedConfigs(prev => [...prev, response.data || response])
      alert('تم حفظ إعدادات الفلاتر بنجاح')
    } catch (err) {
      console.error('Failed to save filter config:', err)
      alert('فشل في حفظ إعدادات الفلاتر')
    }
  }

  const loadConfig = (config: FilterConfig) => {
    setFilters(config.filters)
    setSelectedConfig(config)
    setShowSavedConfigs(false)
  }

  const deleteConfig = async (configId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعداد؟')) {
      return
    }

    try {
      await apiClient.request(`/api/filters/configs/${configId}`, {
        method: 'DELETE'
      })

      setSavedConfigs(prev => prev.filter(config => config.id !== configId))
    } catch (err) {
      console.error('Failed to delete filter config:', err)
      alert('فشل في حذف إعداد الفلاتر')
    }
  }

  const getFieldOptions = (entityType: string) => {
    const fieldOptions = {
      'capa': [
        { value: 'title', label: 'العنوان' },
        { value: 'description', label: 'الوصف' },
        { value: 'status', label: 'الحالة' },
        { value: 'priority', label: 'الأولوية' },
        { value: 'department', label: 'القسم' },
        { value: 'assigned_to', label: 'المسؤول' },
        { value: 'created_at', label: 'تاريخ الإنشاء' },
        { value: 'target_date', label: 'الموعد النهائي' },
        { value: 'severity', label: 'الخطورة' },
        { value: 'estimated_cost', label: 'التكلفة المقدرة' }
      ],
      'round': [
        { value: 'title', label: 'العنوان' },
        { value: 'department', label: 'القسم' },
        { value: 'status', label: 'الحالة' },
        { value: 'round_type', label: 'نوع الجولة' },
        { value: 'created_at', label: 'تاريخ الإنشاء' },
        { value: 'scheduled_date', label: 'التاريخ المجدول' },
        { value: 'assigned_to', label: 'المسؤول' },
        { value: 'compliance_percentage', label: 'نسبة الامتثال' }
      ],
      'user': [
        { value: 'first_name', label: 'الاسم الأول' },
        { value: 'last_name', label: 'الاسم الأخير' },
        { value: 'email', label: 'البريد الإلكتروني' },
        { value: 'role', label: 'الدور' },
        { value: 'department', label: 'القسم' },
        { value: 'is_active', label: 'نشط' },
        { value: 'created_at', label: 'تاريخ الإنشاء' }
      ],
      'department': [
        { value: 'name', label: 'الاسم' },
        { value: 'description', label: 'الوصف' },
        { value: 'is_active', label: 'نشط' },
        { value: 'created_at', label: 'تاريخ الإنشاء' }
      ]
    }

    return fieldOptions[entityType as keyof typeof fieldOptions] || []
  }

  const getOperatorOptions = (type: string) => {
    const operatorOptions = {
      'text': [
        { value: 'equals', label: 'يساوي' },
        { value: 'contains', label: 'يحتوي على' },
        { value: 'starts_with', label: 'يبدأ بـ' },
        { value: 'ends_with', label: 'ينتهي بـ' }
      ],
      'select': [
        { value: 'equals', label: 'يساوي' },
        { value: 'not_equals', label: 'لا يساوي' }
      ],
      'multi_select': [
        { value: 'in', label: 'ضمن' },
        { value: 'not_in', label: 'ليس ضمن' }
      ],
      'date_range': [
        { value: 'between', label: 'بين' },
        { value: 'greater_than', label: 'أكبر من' },
        { value: 'less_than', label: 'أصغر من' }
      ],
      'number_range': [
        { value: 'equals', label: 'يساوي' },
        { value: 'greater_than', label: 'أكبر من' },
        { value: 'less_than', label: 'أصغر من' },
        { value: 'between', label: 'بين' }
      ],
      'boolean': [
        { value: 'equals', label: 'يساوي' }
      ]
    }

    return operatorOptions[type as keyof typeof operatorOptions] || operatorOptions['text']
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      'text': Search,
      'select': Target,
      'multi_select': Target,
      'date_range': Calendar,
      'number_range': DollarSign,
      'boolean': CheckCircle,
      'autocomplete': Users
    }
    return icons[type as keyof typeof icons] || Search
  }

  const getTypeText = (type: string) => {
    const texts = {
      'text': 'نص',
      'select': 'قائمة',
      'multi_select': 'قائمة متعددة',
      'date_range': 'نطاق تاريخ',
      'number_range': 'نطاق رقم',
      'boolean': 'نعم/لا',
      'autocomplete': 'اكتمال تلقائي'
    }
    return texts[type as keyof typeof texts] || type
  }

  const renderFilterInput = (filter: FilterItem) => {
    switch (filter.type) {
      case 'text':
        return (
          <Input
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder={filter.placeholder || 'أدخل النص...'}
            className="w-full"
          />
        )
      case 'select':
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر...</option>
            {filter.options?.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      case 'multi_select':
        return (
          <div className="w-full">
            <select
              multiple
              value={Array.isArray(filter.value) ? filter.value : []}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                updateFilter(filter.id, { value: values })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filter.options?.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        )
      case 'date_range':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              value={filter.value?.start || ''}
              onChange={(e) => updateFilter(filter.id, { 
                value: { ...filter.value, start: e.target.value }
              })}
              className="flex-1"
            />
            <Input
              type="date"
              value={filter.value?.end || ''}
              onChange={(e) => updateFilter(filter.id, { 
                value: { ...filter.value, end: e.target.value }
              })}
              className="flex-1"
            />
          </div>
        )
      case 'number_range':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={filter.value?.min || ''}
              onChange={(e) => updateFilter(filter.id, { 
                value: { ...filter.value, min: e.target.value }
              })}
              placeholder="الحد الأدنى"
              className="flex-1"
            />
            <Input
              type="number"
              value={filter.value?.max || ''}
              onChange={(e) => updateFilter(filter.id, { 
                value: { ...filter.value, max: e.target.value }
              })}
              placeholder="الحد الأقصى"
              className="flex-1"
            />
          </div>
        )
      case 'boolean':
        return (
          <select
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value === 'true' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">اختر...</option>
            <option value="true">نعم</option>
            <option value="false">لا</option>
          </select>
        )
      default:
        return (
          <Input
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
            placeholder="أدخل القيمة..."
            className="w-full"
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              فلاتر متقدمة
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSavedConfigs(!showSavedConfigs)}
                className="flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                الإعدادات المحفوظة
              </Button>
              <Button
                size="sm"
                onClick={addFilter}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                إضافة فلتر
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filters.length === 0 ? (
            <div className="text-center py-8">
              <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد فلاتر</p>
              <p className="text-sm text-gray-400 mt-2">اضغط على "إضافة فلتر" لبدء التصفية</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filters.map((filter) => {
                const TypeIcon = getTypeIcon(filter.type)
                
                return (
                  <div key={filter.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <TypeIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              الحقل
                            </label>
                            <select
                              value={filter.field}
                              onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">اختر الحقل...</option>
                              {getFieldOptions(entityType).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              النوع
                            </label>
                            <select
                              value={filter.type}
                              onChange={(e) => updateFilter(filter.id, { type: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="text">نص</option>
                              <option value="select">قائمة</option>
                              <option value="multi_select">قائمة متعددة</option>
                              <option value="date_range">نطاق تاريخ</option>
                              <option value="number_range">نطاق رقم</option>
                              <option value="boolean">نعم/لا</option>
                              <option value="autocomplete">اكتمال تلقائي</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              المشغل
                            </label>
                            <select
                              value={filter.operator}
                              onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {getOperatorOptions(filter.type).map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              القيمة
                            </label>
                            {renderFilterInput(filter)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={filter.required}
                                onChange={(e) => updateFilter(filter.id, { required: e.target.checked })}
                                className="rounded"
                              />
                              مطلوب
                            </label>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFilter(filter.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {filters.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {filters.length} فلتر
                  </Badge>
                  {filters.filter(f => f.required).length > 0 && (
                    <Badge variant="outline" className="text-orange-600">
                      {filters.filter(f => f.required).length} مطلوب
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAllFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    مسح الكل
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowBuilder(true)}
                    className="flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    حفظ الإعداد
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Configs */}
      {showSavedConfigs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              الإعدادات المحفوظة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">جاري التحميل...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
              </div>
            ) : savedConfigs.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد إعدادات محفوظة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedConfigs
                  .filter(config => 
                    config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    config.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((config) => (
                    <div key={config.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{config.name}</h4>
                          <p className="text-sm text-gray-600">{config.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {config.filters.length} فلتر
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {config.usage_count} استخدام
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadConfig(config)}
                            className="flex items-center gap-1"
                          >
                            <Loader2 className="w-3 h-3" />
                            تحميل
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteConfig(config.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Config Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">حفظ إعدادات الفلاتر</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم الإعداد
                  </label>
                  <Input
                    placeholder="أدخل اسم الإعداد..."
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف
                  </label>
                  <Input
                    placeholder="أدخل وصف الإعداد..."
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowBuilder(false)}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={() => {
                    // Save logic here
                    setShowBuilder(false)
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  حفظ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFilters
