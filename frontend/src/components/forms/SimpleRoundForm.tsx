import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'

interface SimpleRoundFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
}

const SimpleRoundForm: React.FC<SimpleRoundFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    round_type: 'infection_control',
    department: '',
    scheduled_date: '',
    deadline: '7',
    priority: 'medium',
    notes: ''
  })

  // Use departments hook
  const { data: departments, loading: departmentsLoading, error: departmentsError } = useDepartments()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.department) {
      alert('يرجى اختيار القسم')
      return
    }
    
    const submitData = {
      ...formData,
      round_code: `RND-${Date.now().toString(36).toUpperCase()}`,
      assigned_to: JSON.stringify(['مدير النظام']),
      selected_categories: [1], // Default to first category
      selected_items: []
    }
    
    onSubmit(submitData)
  }

  const roundTypes = [
    { value: 'infection_control', label: 'مكافحة العدوى' },
    { value: 'patient_safety', label: 'سلامة المرضى' },
    { value: 'quality_assurance', label: 'ضمان الجودة' },
    { value: 'environmental', label: 'البيئة' },
    { value: 'medication_safety', label: 'سلامة الأدوية' }
  ]

  const deadlineOptions = [
    { value: '3', label: '3 أيام' },
    { value: '5', label: '5 أيام' },
    { value: '7', label: 'أسبوع' },
    { value: '14', label: 'أسبوعين' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'منخفضة' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'عالية' },
    { value: 'urgent', label: 'عاجلة' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-6 h-6" />
            إنشاء جولة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title and Description */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الجولة</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="أدخل عنوان الجولة"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">وصف الجولة</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="أدخل وصف الجولة"
                  rows={3}
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <Label>القسم</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                disabled={departmentsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={departmentsLoading ? "جاري تحميل الأقسام..." : "اختر القسم"} />
                </SelectTrigger>
                <SelectContent>
                  {departments?.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>
                      <div className="flex flex-col">
                        <span>{dept.name}</span>
                        <span className="text-xs text-gray-500">{dept.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {departmentsError && (
                <p className="text-sm text-red-600 mt-1">خطأ في تحميل الأقسام: {departmentsError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">اختر القسم المراد تقييمه</p>
            </div>

            {/* Round Type and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="round_type">نوع الجولة</Label>
                <select
                  id="round_type"
                  value={formData.round_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, round_type: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roundTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="scheduled_date">التاريخ المجدول</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Deadline and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deadline">المهلة</Label>
                <select
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {deadlineOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="priority">الأولوية</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">تعليق للمقيمين</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أدخل تعليقات أو تعليمات للمقيمين"
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                إنشاء الجولة
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SimpleRoundForm
