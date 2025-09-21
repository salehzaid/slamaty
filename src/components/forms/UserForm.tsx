import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userCreateSchema, UserCreateForm } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Lock, UserCheck, Building, Phone, Briefcase } from 'lucide-react'

interface UserFormProps {
  onSubmit: (data: UserCreateForm) => void
  isLoading?: boolean
  initialData?: Partial<UserCreateForm>
  title?: string
  description?: string
}

const UserForm: React.FC<UserFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
  title = "إضافة مستخدم جديد",
  description = "قم بملء البيانات المطلوبة لإضافة مستخدم جديد"
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<UserCreateForm>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: initialData || {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'viewer',
      department: '',
      phone: '',
      position: '',
      password: '',
      confirmPassword: ''
    }
  })

  const watchedRole = watch('role')

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                الاسم الأول *
              </Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="أدخل الاسم الأول"
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                اسم العائلة *
              </Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="أدخل اسم العائلة"
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                البريد الإلكتروني *
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="example@hospital.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+966 50 123 4567"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Authentication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                اسم المستخدم *
              </Label>
              <Input
                id="username"
                {...register('username')}
                placeholder="أدخل اسم المستخدم"
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                الدور *
              </Label>
              <Select onValueChange={(value) => setValue('role', value as any)}>
                <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">مشاهد</SelectItem>
                  <SelectItem value="assessor">مقيم</SelectItem>
                  <SelectItem value="department_head">رئيس قسم</SelectItem>
                  <SelectItem value="quality_manager">مدير الجودة</SelectItem>
                  <SelectItem value="super_admin">مدير عام</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role.message}</p>
              )}
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {initialData ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور *'}
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder={initialData ? 'أدخل كلمة المرور الجديدة' : 'أدخل كلمة المرور'}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {initialData ? 'تأكيد كلمة المرور الجديدة' : 'تأكيد كلمة المرور *'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder={initialData ? 'أكد كلمة المرور الجديدة' : 'أكد كلمة المرور'}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Department and Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                القسم
              </Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="أدخل اسم القسم"
                className={errors.department ? 'border-red-500' : ''}
              />
              {errors.department && (
                <p className="text-sm text-red-500">{errors.department.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                المنصب
              </Label>
              <Input
                id="position"
                {...register('position')}
                placeholder="أدخل المنصب"
                className={errors.position ? 'border-red-500' : ''}
              />
              {errors.position && (
                <p className="text-sm text-red-500">{errors.position.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline">
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : (initialData ? 'تحديث' : 'حفظ')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default UserForm
