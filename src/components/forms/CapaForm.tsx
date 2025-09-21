import React from 'react'
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
}

const CapaForm: React.FC<CapaFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  title = "خطة تصحيحية لعنصر التقييم",
  description = "قم بإنشاء خطة تصحيحية لعنصر التقييم الذي يحتاج إلى تحسين",
  onCancel
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control
  } = useForm<CapaCreateForm>({
    resolver: zodResolver(capaCreateSchema),
    defaultValues: initialData
  })

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
                {...register('title')}
                placeholder="اسم العنصر أو عنوان الخطة التصحيحية"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {initialData?.title ? 'تم تعبئة العنوان تلقائياً من اسم العنصر' : 'أدخل عنوان الخطة التصحيحية'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                الملاحظة *
              </Label>
              <Textarea
                id="description"
                {...register('description')}
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
                    <input type="checkbox" value={factor} {...register('contributingFactors')} />
                    <span>{factor}</span>
                  </label>
                ))}
                <div className="flex items-center gap-2">
                  <input type="checkbox" value="أخرى" {...register('contributingFactors')} />
                  <Input placeholder="أخرى" {...register('contributingFactors')} />
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
