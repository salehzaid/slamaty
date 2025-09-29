import React, { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { capaCreateSchema, CapaCreateForm } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, FileText } from 'lucide-react'

interface CapaFormProps {
  onSubmit: (data: CapaCreateForm) => void
  isLoading?: boolean
  initialData?: Partial<CapaCreateForm>
  title?: string
  description?: string
  onCancel?: () => void
  isReadOnlyTitle?: boolean
}

const CapaForm: React.FC<CapaFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  title = "خطة تصحيحية لعنصر التقييم",
  description = "قم بإنشاء خطة تصحيحية لعنصر التقييم الذي يحتاج إلى تحسين",
  onCancel,
  isReadOnlyTitle = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    reset
  } = useForm<CapaCreateForm>({
    resolver: zodResolver(capaCreateSchema),
    defaultValues: initialData
  })

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  // Get evaluation item details from initial data
  const evaluationItemTitle = (initialData as any)?.evaluation_item_title
  const evaluationItemCode = (initialData as any)?.evaluation_item_code
  const evaluationItemCategory = (initialData as any)?.evaluation_item_category

  const { fields: actionFields, append, remove } = useFieldArray({
    control,
    name: 'actions' as any
  })


  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Show evaluation item information if available */}
        {evaluationItemTitle && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">عنصر التقييم المرتبط</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-blue-700">اسم العنصر:</span>
                <p className="text-blue-900 font-semibold text-lg">{evaluationItemTitle}</p>
              </div>
              {evaluationItemCode && (
                <div>
                  <span className="text-sm font-medium text-blue-700">كود العنصر:</span>
                  <p className="text-blue-800">{evaluationItemCode}</p>
                </div>
              )}
              {evaluationItemCategory && (
                <div>
                  <span className="text-sm font-medium text-blue-700">الفئة:</span>
                  <p className="text-blue-800">{evaluationItemCategory}</p>
                </div>
              )}
            </div>
            <div className="mt-3 text-sm text-blue-600">
              💡 سيتم استخدام اسم العنصر كعنوان للخطة التصحيحية تلقائياً
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit((data) => {
          try {
            // Send the data directly since we removed the complex fields
            onSubmit(data);
          } catch (error) {
            console.error('Error submitting CAPA form:', error);
          }
        })} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            {/* Show pre-filled info if available */}
            {initialData?.title && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">بيانات تلقائية من عنصر التقييم</span>
                </div>
                <p className="text-blue-800 text-sm">تم تعبئة العنوان والملاحظة تلقائياً من بيانات عنصر التقييم. يمكنك تعديلها حسب الحاجة.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                عنوان الخطة التصحيحية *
              </Label>
              <Input
                id="title"
                {...register('title', { 
                  required: "عنوان الخطة التصحيحية مطلوب",
                  minLength: { value: 5, message: "العنوان يجب أن يكون 5 أحرف على الأقل" }
                })}
                placeholder="اسم العنصر أو عنوان الخطة التصحيحية"
                className={errors.title ? 'border-red-500' : ''}
                readOnly={isReadOnlyTitle}
                disabled={isReadOnlyTitle}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {isReadOnlyTitle ? 'تم تعبئة العنوان تلقائياً من اسم عنصر التقييم (غير قابل للتعديل)' : 
                 initialData?.title ? 'تم تعبئة العنوان تلقائياً من اسم العنصر' : 'أدخل عنوان الخطة التصحيحية'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                الملاحظة *
              </Label>
              <Textarea
                id="description"
                {...register('description', {
                  required: "الملاحظة مطلوبة",
                  minLength: { value: 10, message: "الملاحظة يجب أن تكون 10 أحرف على الأقل" }
                })}
                placeholder="الملاحظة المسجلة على العنصر أو وصف المشكلة"
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {initialData?.description ? 'تم تعبئة الملاحظة تلقائياً من ملاحظة المقيم' : 'أدخل الملاحظة أو وصف المشكلة'}
              </p>
            </div>

            {/* Root Cause Analysis */}
            <div className="space-y-2">
              <Label htmlFor="rootCauseAnalysis" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                تحليل السبب الجذري
              </Label>
              <Textarea
                id="rootCauseAnalysis"
                {...register('rootCauseAnalysis')}
                placeholder="اكتب تحليل السبب الجذري هنا"
                rows={5}
              />
            </div>

            {/* Contributing Factors */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                العوامل المساهمة
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {['نقص في التدريب','عدم وضوح الإجراءات','نقص في الموارد','ضعف في الإشراف','مشاكل في النظام'].map((factor) => (
                  <label key={factor} className="inline-flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      value={factor} 
                      {...register('contributingFactors')}
                      className="rounded"
                    />
                    <span>{factor}</span>
                  </label>
                ))}
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    value="أخرى" 
                    {...register('contributingFactors')}
                    className="rounded"
                  />
                  <Input placeholder="أخرى" className="flex-1" />
                </div>
              </div>
            </div>
          </div>


          {/* Actions list (dynamic) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              الإجراءات المطلوب تنفيذها
            </Label>
            <div className="space-y-3">
              {actionFields.map((field, index) => (
                <div key={field.id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input placeholder="الإجراء المطلوب" {...register(`actions.${index}.action` as const)} />
                    <Input placeholder="المسؤول عن التنفيذ" {...register(`actions.${index}.responsible` as const)} />
                    <div className="flex gap-2">
                      <Input type="date" {...register(`actions.${index}.startDate` as const, { valueAsDate: true })} />
                      <Input type="date" {...register(`actions.${index}.endDate` as const, { valueAsDate: true })} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Input placeholder="الموارد المطلوبة" {...register(`actions.${index}.resources` as const)} />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button type="button" variant="outline" onClick={() => remove(index)}>حذف</Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={() => append({ action: '', responsible: '', startDate: undefined, endDate: undefined, resources: '' })}>إضافة إجراء</Button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onCancel && onCancel()}>
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

export default CapaForm
