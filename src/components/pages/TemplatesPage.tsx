import React, { useState } from 'react'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, FileText, Copy, Eye, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const TemplatesPage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  // TODO: Replace with API call to get templates from database
  const mockTemplates: any[] = [
    {
      id: 1,
      name: 'نموذج تقييم سلامة الأدوية',
      description: 'نموذج تقييم تخزين وإدارة الأدوية',
      category: 'medication_safety',
      version: '1.2',
      questions: 12,
      isActive: false,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z'
    }
  ];

  const handleCreateTemplate = async (data: any) => {
    try {
      console.log('Creating template:', data)
      setShowCreateForm(false)
      // Here you would call the API to create a template
    } catch (error) {
      console.error('Failed to create template:', error)
    }
  }

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template)
    setShowCreateForm(true)
  }

  const handleDeleteTemplate = (templateId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا النموذج؟')) {
      console.log('Deleting template:', templateId)
      // Here you would call the API to delete a template
    }
  }

  const handleCopyTemplate = (templateId: number) => {
    console.log('Copying template:', templateId)
    // Here you would implement copying a template
  }

  const handlePreviewTemplate = (templateId: number) => {
    console.log('Previewing template:', templateId)
    // Here you would implement previewing a template
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'patient_safety': 'bg-blue-100 text-blue-800',
      'infection_control': 'bg-red-100 text-red-800',
      'hygiene': 'bg-green-100 text-green-800',
      'medication_safety': 'bg-yellow-100 text-yellow-800',
      'equipment_safety': 'bg-purple-100 text-purple-800',
      'environmental': 'bg-orange-100 text-orange-800',
      'general': 'bg-gray-100 text-gray-800',
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryText = (category: string) => {
    const texts = {
      'patient_safety': 'سلامة المرضى',
      'infection_control': 'مكافحة العدوى',
      'hygiene': 'النظافة',
      'medication_safety': 'سلامة الأدوية',
      'equipment_safety': 'سلامة المعدات',
      'environmental': 'البيئة',
      'general': 'عام',
    }
    return texts[category as keyof typeof texts] || category
  }

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory
    return matchesSearch && matchesCategory
  })

  if (showCreateForm) {
    return (
      <div className="p-6">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {editingTemplate ? "تعديل النموذج" : "إضافة نموذج جديد"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const data = Object.fromEntries(formData.entries())
              handleCreateTemplate(data)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم النموذج *
                </label>
                <Input
                  name="name"
                  defaultValue={editingTemplate?.name || ''}
                  placeholder="أدخل اسم النموذج"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  name="description"
                  defaultValue={editingTemplate?.description || ''}
                  placeholder="أدخل وصف النموذج"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة *
                  </label>
                  <select
                    name="category"
                    defaultValue={editingTemplate?.category || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر الفئة</option>
                    <option value="patient_safety">سلامة المرضى</option>
                    <option value="infection_control">مكافحة العدوى</option>
                    <option value="hygiene">النظافة</option>
                    <option value="medication_safety">سلامة الأدوية</option>
                    <option value="equipment_safety">سلامة المعدات</option>
                    <option value="environmental">البيئة</option>
                    <option value="general">عام</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الإصدار
                  </label>
                  <Input
                    name="version"
                    defaultValue={editingTemplate?.version || '1.0'}
                    placeholder="1.0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingTemplate(null)
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            قوالب التقييم
          </h1>
          <p className="text-gray-600">إدارة قوالب التقييم والمعايير</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة نموذج جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي النماذج</p>
                <p className="text-2xl font-bold text-gray-900">{mockTemplates.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">نشط</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockTemplates.filter(t => t.isActive).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الأسئلة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {mockTemplates.reduce((sum, t) => sum + t.questions, 0)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الفئات</p>
                <p className="text-2xl font-bold text-purple-600">
                  {[...new Set(mockTemplates.map(t => t.category))].length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في النماذج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الفئات</option>
                <option value="patient_safety">سلامة المرضى</option>
                <option value="infection_control">مكافحة العدوى</option>
                <option value="hygiene">النظافة</option>
                <option value="medication_safety">سلامة الأدوية</option>
                <option value="equipment_safety">سلامة المعدات</option>
                <option value="environmental">البيئة</option>
                <option value="general">عام</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                فلترة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryText(template.category)}
                    </Badge>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <Badge variant="outline">v{template.version}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewTemplate(template.id)}
                    title="معاينة"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyTemplate(template.id)}
                    title="نسخ"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>عدد الأسئلة:</span>
                  <span className="font-medium">{template.questions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>أنشأ بواسطة:</span>
                  <span className="font-medium">{template.createdBy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>آخر تعديل:</span>
                  <span className="font-medium">
                    {new Date(template.lastModified).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePreviewTemplate(template.id)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  معاينة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCopyTemplate(template.id)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  نسخ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Download template:', template.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد نماذج مطابقة للبحث</p>
        </div>
      )}
    </div>
  )
}

export default TemplatesPage
