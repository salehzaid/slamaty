import React, { useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, FileText, Plus, Trash2, Calendar, User, DollarSign, AlertCircle } from 'lucide-react'

// Validation schemas
const ActionItemSchema = z.object({
  task: z.string().min(3, 'المهمة يجب أن تكون 3 أحرف على الأقل'),
  due_date: z.string().optional(),
  assigned_to_id: z.number().optional(),
  status: z.string().default('open'),
  completed_at: z.string().optional(),
  notes: z.string().optional()
})

const VerificationStepSchema = z.object({
  step: z.string().min(3, 'الخطوة يجب أن تكون 3 أحرف على الأقل'),
  required: z.boolean().default(true),
  completed: z.boolean().default(false),
  completed_at: z.string().optional(),
  completed_by_id: z.number().optional(),
  notes: z.string().optional()
})

const CapaCreateSchema = z.object({
  title: z.string().min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  root_cause: z.string().optional(),
  corrective_actions: z.array(ActionItemSchema).default([]),
  preventive_actions: z.array(ActionItemSchema).default([]),
  verification_steps: z.array(VerificationStepSchema).default([]),
  severity: z.number().min(1).max(5).default(3),
  estimated_cost: z.number().optional(),
  sla_days: z.number().min(1).max(365).default(14),
  round_id: z.number().optional(),
  evaluation_item_id: z.number().optional(),
  department: z.string().min(1, 'القسم مطلوب'),
  assigned_to_id: z.number().optional()
})

export type CapaCreateForm = z.infer<typeof CapaCreateSchema>

interface EnhancedCapaFormProps {
  onSubmit: (data: CapaCreateForm) => void
  isLoading?: boolean
  initialData?: Partial<CapaCreateForm>
  title?: string
  description?: string
  onCancel?: () => void
  isReadOnlyTitle?: boolean
  departments?: Array<{ id: number; name: string }>
  users?: Array<{ id: number; first_name: string; last_name: string }>
}

const EnhancedCapaForm: React.FC<EnhancedCapaFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  title = "خطة تصحيحية محسنة",
  description = "قم بإنشاء خطة تصحيحية شاملة مع الإجراءات التصحيحية والوقائية وخطوات التحقق",
  onCancel,
  isReadOnlyTitle = false,
  departments = [],
  users = []
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    reset,
    setValue
  } = useForm<CapaCreateForm>({
    resolver: zodResolver(CapaCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      root_cause: '',
      corrective_actions: [],
      preventive_actions: [],
      verification_steps: [],
      severity: 3,
      estimated_cost: undefined,
      sla_days: 14,
      round_id: undefined,
      evaluation_item_id: undefined,
      department: '',
      assigned_to_id: undefined,
      ...initialData
    }
  })

  // Field arrays for dynamic fields
  const { fields: correctiveFields, append: appendCorrective, remove: removeCorrective } = useFieldArray({
    control,
    name: 'corrective_actions'
  })

  const { fields: preventiveFields, append: appendPreventive, remove: removePreventive } = useFieldArray({
    control,
    name: 'preventive_actions'
  })

  const { fields: verificationFields, append: appendVerification, remove: removeVerification } = useFieldArray({
    control,
    name: 'verification_steps'
  })

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const severity = watch('severity')
  const severityLabels = {
    1: { label: 'منخفض', color: 'bg-green-100 text-green-800' },
    2: { label: 'متوسط منخفض', color: 'bg-yellow-100 text-yellow-800' },
    3: { label: 'متوسط', color: 'bg-orange-100 text-orange-800' },
    4: { label: 'عالي', color: 'bg-red-100 text-red-800' },
    5: { label: 'حرج', color: 'bg-red-200 text-red-900' }
  }

  const getSeverityColor = (level: number) => {
    return severityLabels[level as keyof typeof severityLabels]?.color || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              المعلومات الأساسية
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  عنوان الخطة التصحيحية *
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="عنوان الخطة التصحيحية"
                  className={errors.title ? 'border-red-500' : ''}
                  readOnly={isReadOnlyTitle}
                  disabled={isReadOnlyTitle}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  القسم *
                </Label>
                <Select onValueChange={(value) => setValue('department', value)}>
                  <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department && (
                  <p className="text-sm text-red-500">{errors.department.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                وصف المشكلة *
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="وصف تفصيلي للمشكلة"
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="root_cause" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                تحليل السبب الجذري
              </Label>
              <Textarea
                id="root_cause"
                {...register('root_cause')}
                placeholder="تحليل السبب الجذري للمشكلة"
                rows={4}
              />
            </div>
          </div>

          {/* Severity and Cost */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              مستوى الخطورة والتكلفة
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="severity" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  مستوى الخطورة *
                </Label>
                <Select onValueChange={(value) => setValue('severity', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستوى الخطورة" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(severityLabels).map(([level, config]) => (
                      <SelectItem key={level} value={level}>
                        {level} - {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {severity && (
                  <Badge className={getSeverityColor(severity)}>
                    {severityLabels[severity as keyof typeof severityLabels]?.label}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_cost" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  التكلفة المتوقعة
                </Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  {...register('estimated_cost', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sla_days" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  مهلة الحل (أيام) *
                </Label>
                <Input
                  id="sla_days"
                  type="number"
                  min="1"
                  max="365"
                  {...register('sla_days', { valueAsNumber: true })}
                  placeholder="14"
                />
              </div>
            </div>
          </div>

          {/* Corrective Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                الإجراءات التصحيحية
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendCorrective({ task: '', due_date: '', assigned_to_id: undefined, status: 'open' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة إجراء
              </Button>
            </div>

            <div className="space-y-3">
              {correctiveFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المهمة *</Label>
                      <Input
                        {...register(`corrective_actions.${index}.task`)}
                        placeholder="وصف المهمة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ الاستحقاق</Label>
                      <Input
                        type="date"
                        {...register(`corrective_actions.${index}.due_date`)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المسؤول</Label>
                      <Select onValueChange={(value) => setValue(`corrective_actions.${index}.assigned_to_id`, parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المسؤول" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Input
                        {...register(`corrective_actions.${index}.notes`)}
                        placeholder="ملاحظات إضافية"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCorrective(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      حذف
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Preventive Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                الإجراءات الوقائية
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendPreventive({ task: '', due_date: '', assigned_to_id: undefined, status: 'open' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة إجراء
              </Button>
            </div>

            <div className="space-y-3">
              {preventiveFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>المهمة *</Label>
                      <Input
                        {...register(`preventive_actions.${index}.task`)}
                        placeholder="وصف المهمة الوقائية"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ الاستحقاق</Label>
                      <Input
                        type="date"
                        {...register(`preventive_actions.${index}.due_date`)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المسؤول</Label>
                      <Select onValueChange={(value) => setValue(`preventive_actions.${index}.assigned_to_id`, parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المسؤول" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Input
                        {...register(`preventive_actions.${index}.notes`)}
                        placeholder="ملاحظات إضافية"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePreventive(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      حذف
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Verification Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                خطوات التحقق
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendVerification({ step: '', required: true, completed: false })}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة خطوة
              </Button>
            </div>

            <div className="space-y-3">
              {verificationFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>خطوة التحقق *</Label>
                      <Input
                        {...register(`verification_steps.${index}.step`)}
                        placeholder="وصف خطوة التحقق"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>إلزامية</Label>
                      <Select onValueChange={(value) => setValue(`verification_steps.${index}.required`, value === 'true')}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">إلزامية</SelectItem>
                          <SelectItem value="false">اختيارية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>ملاحظات</Label>
                      <Input
                        {...register(`verification_steps.${index}.notes`)}
                        placeholder="ملاحظات إضافية"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVerification(index)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      حذف
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : 'حفظ الخطة التصحيحية'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default EnhancedCapaForm
