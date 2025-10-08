import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Plus, 
  Save, 
  Download, 
  Eye,
  Edit,
  Trash2,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  Filter,
  Calendar,
  Users,
  Building2,
  Target,
  Clock,
  DollarSign
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api'

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  created_at: string
  updated_at: string
  created_by: string
  is_public: boolean
  config: ReportConfig
}

interface ReportConfig {
  title: string
  description: string
  data_sources: string[]
  filters: ReportFilter[]
  visualizations: Visualization[]
  layout: LayoutConfig
  schedule?: ScheduleConfig
}

interface ReportFilter {
  id: string
  field: string
  label: string
  type: 'date_range' | 'select' | 'multi_select' | 'number_range' | 'text'
  options?: string[]
  required: boolean
  default_value?: any
}

interface Visualization {
  id: string
  type: 'bar_chart' | 'line_chart' | 'pie_chart' | 'table' | 'metric' | 'gauge'
  title: string
  data_source: string
  x_axis?: string
  y_axis?: string
  group_by?: string
  metrics: string[]
  position: { x: number; y: number; width: number; height: number }
  config: any
}

interface LayoutConfig {
  columns: number
  rows: number
  gap: number
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  day_of_week?: number
  day_of_month?: number
  time: string
  recipients: string[]
  format: 'pdf' | 'excel' | 'email'
}

const CustomReportBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<ReportTemplate>>({
    name: '',
    description: '',
    category: 'general',
    is_public: false,
    config: {
      title: '',
      description: '',
      data_sources: [],
      filters: [],
      visualizations: [],
      layout: { columns: 2, rows: 2, gap: 16 }
    }
  })

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.request('/api/reports/templates/')
      const data = response.data || response
      setTemplates(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch report templates:', err)
      setError('فشل في تحميل قوالب التقارير')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const createTemplate = async () => {
    try {
      const response = await apiClient.request('/api/reports/templates/', {
        method: 'POST',
        body: JSON.stringify(newTemplate)
      })

      setTemplates(prev => [...prev, response.data || response])
      setNewTemplate({
        name: '',
        description: '',
        category: 'general',
        is_public: false,
        config: {
          title: '',
          description: '',
          data_sources: [],
          filters: [],
          visualizations: [],
          layout: { columns: 2, rows: 2, gap: 16 }
        }
      })
      setShowBuilder(false)
    } catch (err) {
      console.error('Failed to create template:', err)
      alert('فشل في إنشاء قالب التقرير')
    }
  }

  const updateTemplate = async (templateId: string, updates: Partial<ReportTemplate>) => {
    try {
      const response = await apiClient.request(`/api/reports/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId 
            ? { ...template, ...updates }
            : template
        )
      )
      setSelectedTemplate(null)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update template:', err)
      alert('فشل في تحديث قالب التقرير')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      return
    }

    try {
      await apiClient.request(`/api/reports/templates/${templateId}`, {
        method: 'DELETE'
      })

      setTemplates(prev => prev.filter(template => template.id !== templateId))
      setSelectedTemplate(null)
    } catch (err) {
      console.error('Failed to delete template:', err)
      alert('فشل في حذف قالب التقرير')
    }
  }

  const generateReport = async (templateId: string) => {
    try {
      const response = await apiClient.request(`/api/reports/generate/${templateId}`, {
        method: 'POST'
      })

      // Download the generated report
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${templateId}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Failed to generate report:', err)
      alert('فشل في توليد التقرير')
    }
  }

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: Date.now().toString(),
      field: '',
      label: '',
      type: 'text',
      required: false
    }

    setNewTemplate(prev => ({
      ...prev,
      config: {
        ...prev.config!,
        filters: [...(prev.config?.filters || []), newFilter]
      }
    }))
  }

  const addVisualization = () => {
    const newViz: Visualization = {
      id: Date.now().toString(),
      type: 'bar_chart',
      title: 'رسم بياني جديد',
      data_source: '',
      metrics: [],
      position: { x: 0, y: 0, width: 1, height: 1 },
      config: {}
    }

    setNewTemplate(prev => ({
      ...prev,
      config: {
        ...prev.config!,
        visualizations: [...(prev.config?.visualizations || []), newViz]
      }
    }))
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      'general': FileText,
      'performance': BarChart3,
      'financial': DollarSign,
      'operational': Target,
      'compliance': Building2,
      'user': Users,
      'time': Clock
    }
    return icons[category as keyof typeof icons] || FileText
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'general': 'bg-gray-100 text-gray-800',
      'performance': 'bg-blue-100 text-blue-800',
      'financial': 'bg-green-100 text-green-800',
      'operational': 'bg-orange-100 text-orange-800',
      'compliance': 'bg-purple-100 text-purple-800',
      'user': 'bg-pink-100 text-pink-800',
      'time': 'bg-yellow-100 text-yellow-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryText = (category: string) => {
    const texts = {
      'general': 'عام',
      'performance': 'أداء',
      'financial': 'مالي',
      'operational': 'تشغيلي',
      'compliance': 'امتثال',
      'user': 'مستخدم',
      'time': 'وقت'
    }
    return texts[category as keyof typeof texts] || category
  }

  const getVisualizationIcon = (type: string) => {
    const icons = {
      'bar_chart': BarChart3,
      'line_chart': LineChart,
      'pie_chart': PieChart,
      'table': Table,
      'metric': Target,
      'gauge': Settings
    }
    return icons[type as keyof typeof icons] || BarChart3
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">جاري تحميل قوالب التقارير...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchTemplates} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            مولد التقارير المخصصة
          </h1>
          <p className="text-gray-600">
            إنشاء وتخصيص التقارير حسب احتياجاتك
          </p>
        </div>
        <Button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          قالب جديد
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => {
          const CategoryIcon = getCategoryIcon(template.category)
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="w-5 h-5 text-gray-600" />
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryText(template.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => generateReport(template.id)}
                      className="p-1"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedTemplate(template)
                        setIsEditing(true)
                      }}
                      className="p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTemplate(template.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <p className="text-sm text-gray-600">{template.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">المرئيات:</span>
                    <span className="font-medium">{template.config.visualizations.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">الفلاتر:</span>
                    <span className="font-medium">{template.config.filters.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">أنشئ بواسطة:</span>
                    <span className="font-medium">{template.created_by}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">آخر تحديث:</span>
                    <span className="font-medium">
                      {new Date(template.updated_at).toLocaleDateString('en-US')}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    {template.config.visualizations.map((viz, index) => {
                      const VizIcon = getVisualizationIcon(viz.type)
                      return (
                        <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
                          <VizIcon className="w-3 h-3" />
                          <span>{viz.title}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد قوالب تقارير</p>
          <p className="text-sm text-gray-400 mt-2">ابدأ بإنشاء قالب تقرير جديد</p>
        </div>
      )}

      {/* Report Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">إنشاء قالب تقرير جديد</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowBuilder(false)}
                  className="p-1"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات أساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        اسم القالب
                      </label>
                      <Input
                        value={newTemplate.name || ''}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="أدخل اسم القالب"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الوصف
                      </label>
                      <Input
                        value={newTemplate.description || ''}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="أدخل وصف القالب"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الفئة
                      </label>
                      <select
                        value={newTemplate.category || 'general'}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">عام</option>
                        <option value="performance">أداء</option>
                        <option value="financial">مالي</option>
                        <option value="operational">تشغيلي</option>
                        <option value="compliance">امتثال</option>
                        <option value="user">مستخدم</option>
                        <option value="time">وقت</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                {/* Filters */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>الفلاتر</CardTitle>
                      <Button size="sm" onClick={addFilter} className="flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        إضافة فلتر
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {newTemplate.config?.filters.map((filter, index) => (
                        <div key={filter.id} className="p-4 border rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                اسم الحقل
                              </label>
                              <Input
                                value={filter.field}
                                onChange={(e) => {
                                  const updatedFilters = [...(newTemplate.config?.filters || [])]
                                  updatedFilters[index].field = e.target.value
                                  setNewTemplate(prev => ({
                                    ...prev,
                                    config: { ...prev.config!, filters: updatedFilters }
                                  }))
                                }}
                                placeholder="اسم الحقل"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                التسمية
                              </label>
                              <Input
                                value={filter.label}
                                onChange={(e) => {
                                  const updatedFilters = [...(newTemplate.config?.filters || [])]
                                  updatedFilters[index].label = e.target.value
                                  setNewTemplate(prev => ({
                                    ...prev,
                                    config: { ...prev.config!, filters: updatedFilters }
                                  }))
                                }}
                                placeholder="تسمية الفلتر"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Visualizations */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>المرئيات</CardTitle>
                      <Button size="sm" onClick={addVisualization} className="flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        إضافة مرئية
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {newTemplate.config?.visualizations.map((viz, index) => (
                        <div key={viz.id} className="p-4 border rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                العنوان
                              </label>
                              <Input
                                value={viz.title}
                                onChange={(e) => {
                                  const updatedViz = [...(newTemplate.config?.visualizations || [])]
                                  updatedViz[index].title = e.target.value
                                  setNewTemplate(prev => ({
                                    ...prev,
                                    config: { ...prev.config!, visualizations: updatedViz }
                                  }))
                                }}
                                placeholder="عنوان المرئية"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                النوع
                              </label>
                              <select
                                value={viz.type}
                                onChange={(e) => {
                                  const updatedViz = [...(newTemplate.config?.visualizations || [])]
                                  updatedViz[index].type = e.target.value as any
                                  setNewTemplate(prev => ({
                                    ...prev,
                                    config: { ...prev.config!, visualizations: updatedViz }
                                  }))
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="bar_chart">رسم بياني عمودي</option>
                                <option value="line_chart">رسم بياني خطي</option>
                                <option value="pie_chart">رسم بياني دائري</option>
                                <option value="table">جدول</option>
                                <option value="metric">مقياس</option>
                                <option value="gauge">مقياس دائري</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowBuilder(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={createTemplate}
                    disabled={!newTemplate.name || !newTemplate.description}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    حفظ القالب
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomReportBuilder
