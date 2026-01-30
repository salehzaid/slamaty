import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  AlertTriangle,
  Heart,
  Droplets,
  Pill,
  Wrench,
  Leaf,
  Settings,
  GripVertical
} from 'lucide-react'
import { useRoundTypes } from '@/hooks/useRoundTypes'
import { RoundTypeSettings } from '@/types'

const RoundTypesSettingsPage: React.FC = () => {
  const { roundTypes, loading, error, createRoundType, updateRoundType, deleteRoundType } = useRoundTypes()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    color: 'blue',
    icon: 'shield',
    is_active: true,
    sort_order: 0
  })

  const colorOptions = [
    { value: 'blue', label: 'أزرق', color: 'bg-blue-500' },
    { value: 'green', label: 'أخضر', color: 'bg-green-500' },
    { value: 'red', label: 'أحمر', color: 'bg-red-500' },
    { value: 'yellow', label: 'أصفر', color: 'bg-yellow-500' },
    { value: 'purple', label: 'بنفسجي', color: 'bg-purple-500' },
    { value: 'orange', label: 'برتقالي', color: 'bg-orange-500' },
    { value: 'pink', label: 'وردي', color: 'bg-pink-500' },
    { value: 'indigo', label: 'نيلي', color: 'bg-indigo-500' },
  ]

  const iconOptions = [
    { value: 'shield', label: 'درع', icon: Shield },
    { value: 'alert-triangle', label: 'تحذير', icon: AlertTriangle },
    { value: 'heart', label: 'قلب', icon: Heart },
    { value: 'droplets', label: 'قطرات', icon: Droplets },
    { value: 'pill', label: 'دواء', icon: Pill },
    { value: 'wrench', label: 'مفتاح', icon: Wrench },
    { value: 'leaf', label: 'ورقة', icon: Leaf },
    { value: 'settings', label: 'إعدادات', icon: Settings },
  ]

  const resetForm = () => {
    setFormData({
      name: '',
      name_en: '',
      description: '',
      color: 'blue',
      icon: 'shield',
      is_active: true,
      sort_order: 0
    })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleCreate = async () => {
    try {
      await createRoundType(formData as any)
      resetForm()
    } catch (error) {
      console.error('Error creating round type:', error)
    }
  }

  const handleEdit = (roundType: RoundTypeSettings) => {
    setFormData({
      name: roundType.name,
      name_en: roundType.nameEn || (roundType as any).name_en || '',
      description: roundType.description || '',
      color: roundType.color,
      icon: roundType.icon,
      is_active: roundType.isActive !== undefined ? roundType.isActive : (roundType as any).is_active,
      sort_order: roundType.sortOrder !== undefined ? roundType.sortOrder : (roundType as any).sort_order
    })
    setEditingId(roundType.id)
    setIsCreating(false)
  }

  const handleUpdate = async () => {
    if (!editingId) return

    try {
      await updateRoundType(editingId, formData as any)
      resetForm()
    } catch (error) {
      console.error('Error updating round type:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف نوع الجولة؟')) {
      try {
        await deleteRoundType(id)
      } catch (error) {
        console.error('Error deleting round type:', error)
      }
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.value === iconName)
    return iconOption ? iconOption.icon : Shield
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل أنواع الجولات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات أنواع الجولات</h1>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          إضافة نوع جولة جديد
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {isCreating ? 'إضافة نوع جولة جديد' : 'تعديل نوع الجولة'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">الاسم بالعربية *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: سلامة المرضى"
                />
              </div>

              <div>
                <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                <Input
                  id="nameEn"
                  value={formData.name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="Example: Patient Safety"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="وصف مختصر لنوع الجولة"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="color">اللون</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="icon">الأيقونة</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(option => {
                      const IconComponent = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sortOrder">ترتيب العرض</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="isActive">نشط</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={isCreating ? handleCreate : handleUpdate}
                disabled={!formData.name.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'إنشاء' : 'حفظ التغييرات'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Round Types List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roundTypes.map((roundType) => {
          const IconComponent = getIconComponent(roundType.icon)
          return (
            <Card key={roundType.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${roundType.color}-100`}>
                      <IconComponent className={`w-5 h-5 text-${roundType.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{roundType.name}</h3>
                      {roundType.nameEn && (
                        <p className="text-sm text-gray-500">{roundType.nameEn}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(roundType)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(roundType.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {roundType.description && (
                  <p className="text-sm text-gray-600 mb-3">{roundType.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={roundType.isActive ? "default" : "secondary"}
                      className={roundType.isActive ? `bg-${roundType.color}-100 text-${roundType.color}-800` : ''}
                    >
                      {roundType.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                    <span className="text-xs text-gray-500">ترتيب: {roundType.sortOrder}</span>
                  </div>

                  <div className="flex items-center gap-1 text-gray-400">
                    <GripVertical className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {roundTypes.length === 0 && !loading && (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أنواع جولات</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة نوع جولة جديد لإدارة أنواع الجولات في النظام</p>
          <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            إضافة نوع جولة جديد
          </Button>
        </div>
      )}
    </div>
  )
}

export default RoundTypesSettingsPage
