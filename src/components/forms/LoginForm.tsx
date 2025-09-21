import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userLoginSchema, UserLoginForm } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

interface LoginFormProps {
  onSubmit: (data: UserLoginForm) => void
  onQuickLogin?: (email: string, password: string) => void
  isLoading?: boolean
  error?: string
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onQuickLogin,
  isLoading = false,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UserLoginForm>({
    resolver: zodResolver(userLoginSchema)
  })

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
        <CardDescription>
          مرحباً بك في نظام سلامتي
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              البريد الإلكتروني
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="أدخل بريدك الإلكتروني"
              className={errors.email ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              كلمة المرور
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="أدخل كلمة المرور"
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={isLoading}
              />
              <span className="text-gray-700">تذكرني</span>
            </label>
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              disabled={isLoading}
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </Button>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">بيانات تجريبية:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>البريد:</strong> admin@salamaty.com</p>
              <p><strong>كلمة المرور:</strong> admin123</p>
            </div>
          </div>

          {/* Quick Login Users */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">تسجيل الدخول السريع:</h4>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => onQuickLogin?.('admin@salamaty.com', 'admin123')}
                className="flex items-center justify-between p-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                <span className="text-gray-700">مدير النظام (SUPER_ADMIN)</span>
                <span className="text-gray-500">admin@salamaty.com</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">انقر على أي مستخدم لتسجيل الدخول مباشرة</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default LoginForm
