import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { userLoginSchema, UserLoginForm } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, Eye, EyeOff, AlertCircle, UserPlus, ArrowLeft } from 'lucide-react'

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
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-gray-900">
          تسجيل الدخول
        </CardTitle>
        <CardDescription>
          مرحباً بك في نظام سلامتي لإدارة جولات الجودة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="أدخل بريدك الإلكتروني"
              className="mt-1"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="أدخل كلمة المرور"
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
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
            className="w-full h-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 ml-2" />
                تسجيل الدخول
              </>
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}

export default LoginForm
