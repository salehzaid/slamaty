import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'
import { User } from '@/types'

// Validation schema
const departmentSchema = z.object({
  name: z.string().min(3, "يجب أن يكون اسم القسم على الأقل 3 أحرف"),
  nameEn: z.string().optional(),
  code: z.string()
    .min(2, "رمز القسم يجب أن يكون على الأقل حرفين")
    .max(10, "رمز القسم يجب أن يكون أقل من 10 أحرف")
    .regex(/^[A-Z0-9_-]+$/, "رمز القسم يجب أن يحتوي على أحرف كبيرة وأرقام فقط"),
  floor: z.string().min(1, "الطابق مطلوب"),
  building: z.string().min(1, "المبنى مطلوب"),
  managers: z.array(z.number()).optional(),
})

export type DepartmentFormData = z.infer<typeof departmentSchema>

interface DepartmentFormProps {
  onSubmit: (data: DepartmentFormData) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<DepartmentFormData & { id?: number }>
  title?: string
  description?: string
  users?: User[]
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  title = "إضافة قسم جديد",
  description = "قم بملء البيانات المطلوبة لإضافة قسم جديد",
  users = []
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      ...initialData,
      code: initialData?.code || `DEPT-${Date.now().toString().slice(-6)}`,
      managers: initialData?.managers || []
    }
  })

  // Handle form submission
  const handleFormSubmit = (data: DepartmentFormData) => {
    console.log('📝 DepartmentForm: handleFormSubmit called with data:', data)
    console.log('📝 Form is valid:', Object.keys(errors).length === 0)
    console.log('📝 Form errors:', errors)
    console.log('📝 Calling onSubmit...')
    onSubmit(data)
    console.log('📝 onSubmit called successfully')
  }

  // Debug form state
  React.useEffect(() => {
    const values = watch()
    console.log('Form state:', { 
      values, 
      errors, 
      isValid: Object.keys(errors).length === 0,
      building: values.building,
      floor: values.floor,
      code: values.code,
      managers: values.managers
    })
    
    if (Object.keys(errors).length > 0) {
      console.log('❌ Validation errors:', errors)
    }
  }, [watch(), errors])

  const selectedManagers = watch('managers') || []
  
  // دالة لإدارة اختيار المسؤولين
  const handleManagerToggle = (userId: number) => {
    const currentManagers = selectedManagers || []
    const isSelected = currentManagers.includes(userId)
    
    if (isSelected) {
      const newManagers = currentManagers.filter(id => id !== userId)
      setValue('managers', newManagers)
    } else {
      const newManagers = [...currentManagers, userId]
      setValue('managers', newManagers)
    }
  }

  // تحويل managers من strings إلى numbers
  React.useEffect(() => {
    const values = watch()
    if (values.managers && Array.isArray(values.managers)) {
      const numericManagers = values.managers.map(id => 
        typeof id === 'string' ? parseInt(id) : id
      ).filter(id => !isNaN(id))
      
      if (JSON.stringify(numericManagers) !== JSON.stringify(values.managers)) {
        setValue('managers', numericManagers)
      }
    }
  }, [watch('managers'), setValue])

  // توليد رمز القسم تلقائياً عند إنشاء قسم جديد فقط
  React.useEffect(() => {
    if (!initialData?.code && !initialData?.id) {
      const generatedCode = `DEPT-${Date.now().toString().slice(-6)}`
      setValue('code', generatedCode)
    }
  }, [initialData?.code, initialData?.id, setValue])

  // تعيين القيم الافتراضية للـ Select components
  React.useEffect(() => {
    if (initialData) {
      if (initialData.building) {
        setValue('building', initialData.building)
      }
      if (initialData.floor) {
        setValue('floor', initialData.floor)
      }
      if (initialData.managers) {
        setValue('managers', initialData.managers)
      }
    }
  }, [initialData, setValue])

  const buildings = [
    'العيادات', 'التنويم', 'الادارة', 'الكلية', 
    'العلاج الطبيعي', 'الخدمات', 'المستودعات', 'السكن'
  ]
  
  const floors = ['الارضي', 'الاول', 'الثاني', 'الثالث', 'الرابع']

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {
          console.log('📋 Form submit event triggered')
          e.preventDefault()
          console.log('📋 Calling handleSubmit...')
          handleSubmit(handleFormSubmit)(e)
        }} className="space-y-4">
          {/* Department Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم القسم (عربي) *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="أدخل اسم القسم بالعربية"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameEn">اسم القسم (إنجليزي)</Label>
              <Input
                id="nameEn"
                {...register('nameEn')}
                placeholder="Enter department name in English"
              />
            </div>
          </div>

          {/* Code and Building */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">رمز القسم *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="أدخل رمز القسم"
                className={`${errors.code ? 'border-red-500' : ''} uppercase`}
                onChange={(e) => {
                  const upperValue = e.target.value.toUpperCase()
                  setValue('code', upperValue)
                }}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
              <p className="text-xs text-gray-500">
                رمز فريد للقسم (مثل: ICU, PEDS, OBS) - سيتم تحويله إلى أحرف كبيرة تلقائياً
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">المبنى *</Label>
              <Select onValueChange={(value) => setValue('building', value)}>
                <SelectTrigger className={errors.building ? 'border-red-500' : ''}>
                  <SelectValue placeholder="اختر المبنى" />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building} value={building}>
                      {building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register('building')} />
              {errors.building && (
                <p className="text-sm text-red-500">{errors.building.message}</p>
              )}
            </div>
          </div>

          {/* Floor */}
          <div className="space-y-2">
            <Label htmlFor="floor">الطابق *</Label>
            <Select onValueChange={(value) => setValue('floor', value)}>
              <SelectTrigger className={errors.floor ? 'border-red-500' : ''}>
                <SelectValue placeholder="اختر الطابق" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((floor) => (
                  <SelectItem key={floor} value={floor}>
                    {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('floor')} />
            {errors.floor && (
              <p className="text-sm text-red-500">{errors.floor.message}</p>
            )}
          </div>

          {/* Managers Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              مسؤولو القسم
            </Label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  لا يوجد مستخدمون متاحون
                </p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedManagers.includes(user.id)}
                        onChange={() => handleManagerToggle(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email} • {user.role}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedManagers.length > 0 && (
              <div className="text-sm text-gray-600">
                تم اختيار {selectedManagers.length} مسؤول
              </div>
            )}
            <input type="hidden" {...register('managers')} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={() => console.log('🔘 Save button clicked')}
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default DepartmentForm
