import React, { useState, useEffect } from 'react'
import { Search, Filter, Edit, Trash2, CheckCircle, AlertTriangle, Target, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useEvaluationApi, EvaluationItem } from '../../hooks/useEvaluationApi'
import { useEvaluationSettings } from '../../hooks/useEvaluationSettings'

const EvaluationItemsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<EvaluationItem | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  const { categories, items, addItem, updateItem, deleteItem } = useEvaluationApi()
  const { getActiveObjectiveOptions } = useEvaluationSettings()

  // تحديث selectedCategoryId عند فتح النموذج
  useEffect(() => {
    if (showCreateForm && editingItem) {
      setSelectedCategoryId((editingItem as any).category_id || (editingItem as any).categoryId)
    } else if (showCreateForm && categories.length > 0) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [showCreateForm, editingItem, categories])

  // دالة لتوليد كود العنصر تلقائياً
  const generateItemCode = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId)
    const categoryCode = category?.name.substring(0, 2).toUpperCase() || 'IT'
    const categoryItems = items.filter(item => item.category_id === categoryId)
    
    // البحث عن أعلى رقم موجود في الكود
    let maxNumber = 0
    categoryItems.forEach(item => {
      const match = item.code.match(/-(\d+)$/)
      if (match) {
        const number = parseInt(match[1], 10)
        if (number > maxNumber) {
          maxNumber = number
        }
      }
    })
    
    const nextNumber = maxNumber + 1
    return `${categoryCode}-${nextNumber.toString().padStart(3, '0')}`
  }

  const handleCreateItem = async (data: Partial<EvaluationItem>) => {
    try {
      const selectedCategory = categories.find(cat => cat.id === Number(data.category_id))
      
      if (!selectedCategory) {
        alert('يرجى اختيار تصنيف صحيح')
        return
      }

      // توليد كود فريد
      let itemCode = generateItemCode(Number(data.category_id))
      let attempts = 0
      const maxAttempts = 10
      
      // التأكد من عدم تكرار الكود
      while (attempts < maxAttempts) {
        const existingItem = items.find(item => item.code === itemCode)
        if (!existingItem) {
          break
        }
        
        // زيادة الرقم وإعادة المحاولة
        const match = itemCode.match(/-(\d+)$/)
        if (match) {
          const currentNumber = parseInt(match[1], 10)
          const categoryCode = selectedCategory.name.substring(0, 2).toUpperCase()
          itemCode = `${categoryCode}-${(currentNumber + 1).toString().padStart(3, '0')}`
        } else {
          itemCode = `${selectedCategory.name.substring(0, 2).toUpperCase()}-${(attempts + 1).toString().padStart(3, '0')}`
        }
        attempts++
      }

      const newItemData = {
        code: itemCode,
        title: data.title || '',
        title_en: data.title_en || '',
        description: data.description || '',
        objective: data.objective || '',
        category_id: Number(data.category_id),
        is_required: data.is_required || false,
        weight: Number(data.weight) || 5,
        risk_level: data.risk_level || 'MINOR',
        evidence_type: data.evidence_type || 'OBSERVATION',
        guidance_ar: data.guidance_ar || '',
        guidance_en: data.guidance_en || '',
        standard_version: data.standard_version || ''
      }
      
      console.log('Creating item with code:', itemCode)
      // ensure required backend fields are set
      const payload = { ...newItemData, is_active: true }
      await addItem(payload as any)
      setShowCreateForm(false)
      setEditingItem(null)
      
      console.log(`تم إضافة عنصر جديد: ${newItemData.title} إلى تصنيف: ${selectedCategory.name}`)
    } catch (error) {
      console.error('Failed to create item:', error)
      alert('فشل في إضافة العنصر. قد يكون الكود مكرراً أو هناك مشكلة أخرى.')
    }
  }

  const handleEditItem = (item: EvaluationItem) => {
    setEditingItem(item)
    setShowCreateForm(true)
  }

  const handleUpdateItem = async (data: Partial<EvaluationItem>) => {
    try {
      const selectedCategory = categories.find(cat => cat.id === Number(data.category_id))
      
      if (!selectedCategory) {
        alert('يرجى اختيار تصنيف صحيح')
        return
      }

      if (!editingItem) return

      const updatedItemData = {
        code: data.code || editingItem.code,
        title: data.title || editingItem.title,
        title_en: data.title_en || editingItem.title_en,
        description: data.description || editingItem.description,
        objective: data.objective || editingItem.objective,
        category_id: Number(data.category_id),
        is_required: data.is_required || editingItem.is_required,
        weight: Number(data.weight) || editingItem.weight,
        risk_level: data.risk_level || editingItem.risk_level,
        evidence_type: data.evidence_type || editingItem.evidence_type,
        guidance_ar: data.guidance_ar || editingItem.guidance_ar,
        guidance_en: data.guidance_en || editingItem.guidance_en,
        standard_version: data.standard_version || editingItem.standard_version
      }
      
      await updateItem(editingItem.id, updatedItemData as any)
      setShowCreateForm(false)
      setEditingItem(null)
      
      console.log(`تم تحديث العنصر: ${updatedItemData.title} في تصنيف: ${selectedCategory.name}`)
    } catch (error) {
      console.error('Failed to update item:', error)
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      try {
        await deleteItem(itemId)
        console.log(`تم حذف العنصر: ${itemId}`)
      } catch (error) {
        console.error('Failed to delete item:', error)
      }
    }
  }

  const getColorClasses = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getEvidenceTypeClasses = (evidenceType: string) => {
    const evidenceColors = {
      'OBSERVATION': 'bg-blue-100 text-blue-800 border-blue-200',
      'DOCUMENT': 'bg-green-100 text-green-800 border-green-200',
      'INTERVIEW': 'bg-purple-100 text-purple-800 border-purple-200',
      'MEASUREMENT': 'bg-orange-100 text-orange-800 border-orange-200',
      'PHOTO': 'bg-pink-100 text-pink-800 border-pink-200'
    }
    return evidenceColors[evidenceType as keyof typeof evidenceColors] || evidenceColors.OBSERVATION
  }

  const getEvidenceTypeLabel = (evidenceType: string) => {
    const labels = {
      'OBSERVATION': 'ملاحظة',
      'DOCUMENT': 'وثيقة',
      'INTERVIEW': 'مقابلة',
      'MEASUREMENT': 'قياس',
      'PHOTO': 'صورة'
    }
    return labels[evidenceType as keyof typeof labels] || evidenceType
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.title_en && item.title_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.objective && item.objective.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = filterCategory === 'all' || item.category_id === Number(filterCategory)
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && item.is_active) ||
                         (filterStatus === 'inactive' && !item.is_active)
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Drawer form content (rendered inline on the page)

  const formContent = (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {editingItem ? 'تعديل العنصر' : 'إضافة عنصر جديد'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const data = Object.fromEntries(formData.entries())

            const evidenceTypes = formData.getAll('evidenceType')
            data.evidenceType = evidenceTypes.join(',')

            const objectives = formData.getAll('objective')
            data.objective = objectives.join(',')

            if (editingItem) {
              handleUpdateItem(data)
            } else {
              handleCreateItem(data)
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">كود العنصر (ترقيم تلقائي)</label>
              <Input
                name="code"
                value={editingItem?.code || (selectedCategoryId ? generateItemCode(selectedCategoryId) : '')}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">سيتم إنشاء الكود تلقائياً بناءً على التصنيف</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف *</label>
              <select
                name="category_id"
                defaultValue={editingItem?.category_id || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
              >
                <option value="">اختر التصنيف</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عنوان العنصر (عربي) *</label>
              <Input name="title" defaultValue={editingItem?.title || ''} placeholder="أدخل عنوان العنصر بالعربية" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عنوان العنصر (إنجليزي)</label>
              <Input name="title_en" defaultValue={editingItem?.title_en || ''} placeholder="Enter item title in English" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">ارتباط العنصر *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border">
              {getActiveObjectiveOptions().map((option) => (
                <label key={option.id} className="flex items-center gap-3 p-3 bg-white rounded-md border hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors">
                  <input type="checkbox" name="objective" value={option.name} defaultChecked={editingItem?.objective?.includes(option.name) || false} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{option.name}</span>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">نوع الدليل *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
              <label className="flex flex-col items-center gap-2 p-3 bg-white rounded-md border hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors">
                <input type="checkbox" name="evidenceType" value="INTERVIEW" defaultChecked={editingItem?.evidence_type?.includes('INTERVIEW') || false} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2" />
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-900">مقابلة</span>
                  <p className="text-xs text-gray-500">حوار مباشر</p>
                </div>
              </label>
              <label className="flex flex-col items-center gap-2 p-3 bg-white rounded-md border hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors">
                <input type="checkbox" name="evidenceType" value="OBSERVATION" defaultChecked={editingItem?.evidence_type?.includes('OBSERVATION') || false} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2" />
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-900">ملاحظة</span>
                  <p className="text-xs text-gray-500">مراقبة مباشرة</p>
                </div>
              </label>
              <label className="flex flex-col items-center gap-2 p-3 bg-white rounded-md border hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors">
                <input type="checkbox" name="evidenceType" value="DOCUMENT" defaultChecked={editingItem?.evidence_type?.includes('DOCUMENT') || false} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2" />
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-900">مستند</span>
                  <p className="text-xs text-gray-500">وثيقة مكتوبة</p>
                </div>
              </label>
              <label className="flex flex-col items-center gap-2 p-3 bg-white rounded-md border hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors">
                <input type="checkbox" name="evidenceType" value="PHOTO" defaultChecked={editingItem?.evidence_type?.includes('PHOTO') || false} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2" />
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-900">صورة</span>
                  <p className="text-xs text-gray-500">دليل بصري</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوزن (1-10)</label>
              <Input name="weight" type="number" min="1" max="10" defaultValue={editingItem?.weight || 5} placeholder="5" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">مستوى الخطر *</label>
              <select name="risk_level" defaultValue={editingItem?.risk_level || 'MINOR'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="MINOR">بسيط</option>
                <option value="MAJOR">جسيم</option>
                <option value="CRITICAL">حرج</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التوجيه (عربي) *</label>
              <textarea name="guidance_ar" defaultValue={editingItem?.guidance_ar || ''} placeholder="أدخل التوجيه بالعربية" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">التوجيه (إنجليزي)</label>
              <textarea name="guidance_en" defaultValue={editingItem?.guidance_en || ''} placeholder="Enter guidance in English" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setEditingItem(null); }}>
              إلغاء
            </Button>
            <Button type="submit">{editingItem ? 'تحديث' : 'إضافة'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  // render drawer on the right for create/edit on md+ screens
  const renderDrawer = () => {
    if (!showCreateForm) return null
    return (
      <div className="fixed inset-y-0 left-0 md:right-0 md:left-auto w-full md:w-1/3 z-50 p-6 bg-white overflow-auto shadow-xl">
        {formContent}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            عناصر التقييم
          </h1>
          <p className="text-gray-600">إدارة عناصر التقييم وربطها بالتصنيفات</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة عنصر جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي العناصر</p>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">نشط</p>
                <p className="text-2xl font-bold text-green-600">{items.filter((i) => i.is_active).length}</p>
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
                <p className="text-sm font-medium text-gray-600">مطلوب</p>
                <p className="text-2xl font-bold text-red-600">{items.filter((i) => i.is_required).length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسط الوزن</p>
                <p className="text-2xl font-bold text-blue-600">
                  {items.length > 0 ? (items.reduce((sum, i) => sum + i.weight, 0) / items.length).toFixed(1) : '-'}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="البحث في العناصر..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <div className="hidden md:flex gap-2 items-center flex-wrap">
                {/* Category chips */}
                <Button variant={filterCategory === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterCategory('all')}>جميع التصنيفات</Button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setFilterCategory(String(category.id))}
                    className={cn('text-xs px-3 py-1 rounded-full border', filterCategory === String(category.id) ? 'bg-blue-600 text-white border-transparent' : 'bg-white text-gray-700')}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  فلترة
                </Button>
                <Button onClick={() => { setShowCreateForm(true); setEditingItem(null); }} className="flex items-center gap-2 md:hidden">
                  <Plus className="w-4 h-4" />
                  إضافة
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List - responsive grid: 1 / 2 / 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-white">
            {/* Header with title and code */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">كود: {item.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { handleEditItem(item); setShowCreateForm(true); }} title="تعديل">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-700" title="حذف">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Category and badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getColorClasses(item.category_color))}>
                {item.category_name}
              </span>
              <Badge variant={
                item.risk_level === 'CRITICAL' ? 'destructive' : 
                item.risk_level === 'MAJOR' ? 'default' : 'secondary'
              }>
                {item.risk_level === 'CRITICAL' ? 'حرج' : item.risk_level === 'MAJOR' ? 'جسيم' : 'بسيط'}
              </Badge>
              {item.is_required && (
                <Badge variant="destructive" className="text-xs">
                  مطلوب
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                وزن: {item.weight}
              </Badge>
            </div>

            {/* Concise summary */}
            <div className="space-y-2 text-sm text-gray-600">
              {item.description && (
                <p className="line-clamp-2">
                  <span className="font-medium text-gray-700">الوصف:</span> {item.description}
                </p>
              )}
              {item.objective && (
                <p className="line-clamp-1">
                  <span className="font-medium text-gray-700">الهدف:</span> {item.objective}
                </p>
              )}
              <div className="flex items-center justify-center pt-2 border-t">
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getEvidenceTypeClasses(item.evidence_type))}>
                  نوع الدليل: {getEvidenceTypeLabel(item.evidence_type)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد عناصر مطابقة للبحث</p>
        </div>
      )}
      {renderDrawer()}
    </div>
  )
}

export default EvaluationItemsPage
