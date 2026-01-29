import React, { useState } from 'react'
import { Plus, Search, Filter, Trash2, Shield, AlertTriangle, CheckCircle, Heart, Zap, Eye, Lock, Target, Grid, Edit, Link, RefreshCw, Pill, Stethoscope, Activity, Syringe, Thermometer, Microscope, Cross, Bed, UserCheck, ClipboardCheck, FileText, AlertCircle, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useEvaluationApi, EvaluationCategory } from '../../hooks/useEvaluationApi'

// Extended interface for local use
interface ExtendedEvaluationCategory extends EvaluationCategory {
  nameEn: string
  description: string
  icon: string
  isActive: boolean
  itemCount: number
  createdAt: string
  updatedAt: string
}

const EvaluationCategoriesPage: React.FC = () => {
  console.log('تم تحميل صفحة تصنيفات التقييم')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingCategory, setEditingCategory] = useState<ExtendedEvaluationCategory | null>(null)
  const [activeTab, setActiveTab] = useState<'categories'>('categories')

  const { categories: baseCategories, items, addCategory, updateCategory, deleteCategory, clearAllItems, clearAllData, reloadData, getItemsByCategory, loading, error } = useEvaluationApi()

  console.log('EvaluationCategoriesPage - baseCategories:', baseCategories)
  console.log('EvaluationCategoriesPage - items:', items)
  console.log('EvaluationCategoriesPage - loading:', loading)
  console.log('EvaluationCategoriesPage - error:', error)

  // Transform base categories to extended categories with additional data
  const categories: ExtendedEvaluationCategory[] = baseCategories.map(cat => {
    const categoryItems = items.filter(item =>
      (item.category_ids && item.category_ids.includes(cat.id)) || item.category_id === cat.id
    )
    console.log(`Category ${cat.name} (ID: ${cat.id}) has ${categoryItems.length} items:`, categoryItems)

    return {
      ...cat,
      nameEn: cat.name_en || cat.name, // Use English name if available, fallback to Arabic
      description: cat.description || `تصنيف ${cat.name}`,
      icon: cat.icon || 'shield', // Use the actual icon from database
      isActive: true,
      itemCount: categoryItems.length,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    }
  })

  const handleCreateCategory = async (data: Partial<ExtendedEvaluationCategory>) => {
    try {
      console.log('Received data in handleCreateCategory:', data)

      const newCategoryData = {
        name: data.name as string || '',
        name_en: data.nameEn as string || '',
        description: data.description as string || '',
        color: data.color as string || 'blue',
        icon: data.icon as string || 'shield',
        weight_percent: Number(data.weight_percent) || 10.0,
        is_active: true
      }

      console.log('Processed category data:', newCategoryData)

      await addCategory(newCategoryData)
      setShowCreateForm(false)
      setEditingCategory(null)

      console.log(`تم إنشاء تصنيف جديد: ${newCategoryData.name}`)
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  const handleEditCategory = (category: ExtendedEvaluationCategory) => {
    setEditingCategory(category)
    setShowCreateForm(true)
  }

  const handleUpdateCategory = async (data: Partial<ExtendedEvaluationCategory>) => {
    try {
      if (!editingCategory) return

      console.log('Received data in handleUpdateCategory:', data)
      console.log('Current editingCategory:', editingCategory)

      const updatedCategoryData = {
        name: (data.name as string) || editingCategory.name,
        name_en: (data.nameEn as string) || editingCategory.name_en,
        description: (data.description as string) || editingCategory.description,
        color: (data.color as string) || editingCategory.color,
        icon: (data.icon as string) || editingCategory.icon,
        weight_percent: data.weight_percent !== undefined ? Number(data.weight_percent) : editingCategory.weight_percent
      }

      console.log('Processed update data:', updatedCategoryData)

      await updateCategory(editingCategory.id, updatedCategoryData)
      setShowCreateForm(false)
      setEditingCategory(null)

      console.log(`تم تحديث التصنيف: ${updatedCategoryData.name}`)
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التصنيف؟ سيتم حذف جميع العناصر المرتبطة به.')) {
      try {
        await deleteCategory(categoryId)
        console.log(`تم حذف التصنيف: ${categoryId}`)
      } catch (error) {
        console.error('Failed to delete category:', error)
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
      cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getIcon = (iconName: string) => {
    const icons = {
      shield: Shield,
      heart: Heart,
      'check-circle': CheckCircle,
      lock: Lock,
      zap: Zap,
      eye: Eye,
      'alert-triangle': AlertTriangle,
      // Medical Icons
      pill: Pill,
      stethoscope: Stethoscope,
      activity: Activity,
      syringe: Syringe,
      // 'Bandage' icon was not available in the installed lucide-react build,
      // fallback to 'pill' to avoid runtime import errors.
      bandage: Pill,
      thermometer: Thermometer,
      microscope: Microscope,
      cross: Cross,
      // 'Hospital' icon not available in this lucide build — use 'Bed' as fallback
      hospital: Bed,
      'user-check': UserCheck,
      'clipboard-check': ClipboardCheck,
      'file-text': FileText,
      'alert-circle': AlertCircle,
      clock: Clock,
      star: Star
    }
    const IconComponent = icons[iconName as keyof typeof icons] || Shield
    return <IconComponent className="w-5 h-5" />
  }

  const handleClearAllItems = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع عناصر التقييم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      clearAllItems()
      console.log('تم حذف جميع عناصر التقييم')
    }
  }

  const handleClearAllData = () => {
    if (window.confirm('هل أنت متأكد من حذف جميع بيانات التقييم (التصنيفات والعناصر)؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      clearAllData()
      console.log('تم حذف جميع بيانات التقييم')
    }
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && category.isActive) ||
      (filterStatus === 'inactive' && !category.isActive)
    return matchesSearch && matchesStatus
  })

  if (showCreateForm) {
    return (
      <div className="p-6">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {editingCategory ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const data = Object.fromEntries(formData.entries())

              // Ensure all form fields are properly captured
              const formDataComplete: Partial<ExtendedEvaluationCategory> = {
                name: String(data.name || ''),
                nameEn: String(data.nameEn || ''),
                description: String(data.description || ''),
                color: String(data.color || 'blue'),
                icon: String(data.icon || 'shield'),
                weight_percent: Number(data.weight_percent) || 10.0
              }

              console.log('Form data being submitted:', formDataComplete)

              if (editingCategory) {
                handleUpdateCategory(formDataComplete)
              } else {
                handleCreateCategory(formDataComplete)
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم التصنيف (عربي) *
                  </label>
                  <Input
                    name="name"
                    defaultValue={editingCategory?.name || ''}
                    placeholder="أدخل اسم التصنيف بالعربية"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم التصنيف (إنجليزي)
                  </label>
                  <Input
                    name="nameEn"
                    defaultValue={editingCategory?.nameEn || ''}
                    placeholder="Enter category name in English"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف
                </label>
                <textarea
                  name="description"
                  defaultValue={editingCategory?.description || ''}
                  placeholder="أدخل وصف التصنيف"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللون
                  </label>
                  <select
                    name="color"
                    defaultValue={editingCategory?.color || 'blue'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="red">أحمر</option>
                    <option value="blue">أزرق</option>
                    <option value="green">أخضر</option>
                    <option value="orange">برتقالي</option>
                    <option value="purple">بنفسجي</option>
                    <option value="cyan">سماوي</option>
                    <option value="yellow">أصفر</option>
                    <option value="gray">رمادي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الأيقونة
                  </label>
                  <select
                    name="icon"
                    defaultValue={editingCategory?.icon || 'shield'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {/* General Icons */}
                    <option value="shield">درع</option>
                    <option value="heart">قلب</option>
                    <option value="check-circle">علامة صح</option>
                    <option value="lock">قفل</option>
                    <option value="zap">صاعقة</option>
                    <option value="eye">عين</option>
                    <option value="alert-triangle">مثلث تحذير</option>
                    <option value="star">نجمة</option>
                    <option value="clock">ساعة</option>

                    {/* Medical Icons */}
                    <option value="pill">دواء</option>
                    <option value="stethoscope">سماعة طبية</option>
                    <option value="activity">نشاط</option>
                    <option value="syringe">حقنة</option>
                    <option value="bandage">ضمادة</option>
                    <option value="thermometer">ميزان حرارة</option>
                    <option value="microscope">ميكروسكوب</option>
                    <option value="cross">صليب طبي</option>
                    <option value="hospital">مستشفى</option>
                    <option value="user-check">فحص المريض</option>
                    <option value="clipboard-check">قائمة فحص</option>
                    <option value="file-text">ملف طبي</option>
                    <option value="alert-circle">تنبيه طبي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوزن النسبي (%)
                </label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    name="weight_percent"
                    defaultValue={editingCategory?.weight_percent || 10.0}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-32"
                    required
                  />
                  <span className="text-slate-500 text-sm">وزن التصنيف في المجموع الكلي للتقييم</span>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingCategory(null)
                  }}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingCategory ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  console.log('عرض صفحة التصنيفات الرئيسية، عدد التصنيفات:', categories.length)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            تصنيفات التقييم
          </h1>
          <p className="text-gray-600">إدارة تصنيفات عناصر التقييم والمعايير</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleClearAllData}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            حذف جميع البيانات
          </Button>
          <Button
            onClick={handleClearAllItems}
            variant="outline"
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
          >
            <Trash2 className="w-4 h-4" />
            حذف العناصر فقط
          </Button>
          <Button
            onClick={reloadData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة تحميل
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            إضافة تصنيف جديد
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <p className="text-blue-800">جاري تحميل البيانات...</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('categories')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeTab === 'categories'
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Grid className="w-4 h-4" />
          التصنيفات
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'categories' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي التصنيفات</p>
                    <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                  </div>
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">نشط</p>
                    <p className="text-2xl font-bold text-green-600">
                      {categories.filter(c => c.isActive).length}
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
                    <p className="text-sm font-medium text-gray-600">إجمالي العناصر</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {categories.reduce((sum, c) => sum + c.itemCount, 0)}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">متوسط العناصر</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(categories.reduce((sum, c) => sum + c.itemCount, 0) / categories.length) || 0}
                    </p>
                  </div>
                  <Heart className="w-8 h-8 text-purple-600" />
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
                      placeholder="البحث في التصنيفات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={reloadData}
                    disabled={loading}
                    className={cn(loading && "animate-spin")}
                    title="تحديث البيانات"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    فلترة
                  </Button>
                  <Button onClick={() => { setShowCreateForm(true); setEditingCategory(null); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                    <Plus className="w-4 h-4" />
                    إضافة تصنيف جديد
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        getColorClasses(category.color)
                      )}>
                        {getIcon(category.icon)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <p className="text-sm text-gray-600">{category.nameEn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {category.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getColorClasses(category.color)}>
                          <Link className="w-3 h-3 mr-1 ml-1" />
                          {category.itemCount} عنصر
                        </Badge>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                          <Target className="w-3 h-3 mr-1 ml-1" />
                          الوزن: {category.weight_percent}%
                        </Badge>
                        {category.itemCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {getItemsByCategory(category.id).filter(item => item.is_active).length} نشط
                          </Badge>
                        )}
                      </div>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>

                    {category.itemCount > 0 && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">العناصر المرتبطة ({category.itemCount})</p>
                          <Badge variant="outline" className="text-xs">
                            {category.itemCount} عنصر
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {getItemsByCategory(category.id).slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs group hover:bg-gray-100 dark:hover:bg-slate-700 p-1 rounded transition-colors">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.risk_level === 'CRITICAL' ? 'bg-red-500' :
                                  item.risk_level === 'MAJOR' ? 'bg-orange-500' : 'bg-blue-500'
                                  }`}></div>
                                <span className="text-gray-700 dark:text-gray-300 truncate" title={item.title}>
                                  {item.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge
                                  variant={item.risk_level === 'CRITICAL' ? 'destructive' :
                                    item.risk_level === 'MAJOR' ? 'default' : 'secondary'}
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {item.risk_level === 'CRITICAL' ? 'حرج' :
                                    item.risk_level === 'MAJOR' ? 'جسيم' : 'بسيط'}
                                </Badge>
                                <span className="text-gray-500 text-xs font-mono">
                                  {item.weight}w
                                </span>
                              </div>
                            </div>
                          ))}
                          {category.itemCount > 3 && (
                            <div className="pt-1 border-t border-gray-200 dark:border-slate-600">
                              <div className="flex items-center justify-center">
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                                  +{category.itemCount - 3} عناصر أخرى
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      آخر تحديث: {new Date(category.updatedAt).toLocaleDateString('en-US')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد تصنيفات مطابقة للبحث</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

export default EvaluationCategoriesPage
