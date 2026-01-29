import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { userLoginSchema, UserLoginForm } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Eye, EyeOff, AlertCircle, UserPlus, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { login } = useAuth() as any
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UserLoginForm>({
    resolver: zodResolver(userLoginSchema)
  })

  const onSubmit = async (data: UserLoginForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('🔐 Login form submission for:', data.email)
      const success = await login(data.email, data.password)
      console.log('📥 Login result:', success)
      if (success) {
        setSuccess('تم تسجيل الدخول بنجاح!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        setError('فشل في تسجيل الدخول. تحقق من صحة البريد الإلكتروني وكلمة المرور.')
      }
    } catch (err: any) {
      console.error('❌ Login error in form:', err)
      const errorMessage = err?.message || 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.'
      console.error('Setting error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // If backend is unavailable in DEV, allow demo guest login
      if (typeof window !== 'undefined' && (window as any).__API_UNAVAILABLE__ && import.meta.env.DEV) {
        const demoUser = { id: 999, username: 'demo', email: 'demo@local', first_name: 'مستخدم', last_name: 'تجريبي', role: 'quality_manager' }
        try {
          localStorage.setItem('sallamaty_user', JSON.stringify(demoUser))
          localStorage.setItem('access_token', 'demo-token')
          // set token for api client if available
          try {
            const { apiClient } = await import('@/lib/api')
            apiClient.setToken('demo-token')
          } catch { }
          setSuccess('تم تسجيل الدخول كعرض تجريبي')
          setTimeout(() => navigate('/dashboard'), 800)
          return
        } catch (e) {
          setError('فشل في تسجيل الدخول التجريبي.')
          return
        }
      }

      const success = await login('admin@salamaty.com', 'admin123')
      if (success) {
        setSuccess('تم تسجيل الدخول بنجاح!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 1000)
      } else {
        setError('فشل في تسجيل الدخول السريع.')
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول السريع.')
    } finally {
      setIsLoading(false)
    }
  }

  const isApiUnavailable = typeof window !== 'undefined' && (window as any).__API_UNAVAILABLE__

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            نظام سلامتي
          </h1>
          <p className="text-gray-600">
            إدارة جولات الجودة والامتثال
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              تسجيل الدخول
            </CardTitle>
            <CardDescription>
              مرحباً بك في نظام سلامتي لإدارة جولات الجودة
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 ml-2" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-green-600 ml-2" />
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}

            {/* Login Form */}
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
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="remember" className="mr-2 text-sm text-gray-600">
                    تذكرني
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full"
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

            {/* Quick Login Button */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">أو</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleQuickLogin}
              disabled={isLoading}
            >
              <UserPlus className="w-5 h-5 ml-2" />
              تسجيل سريع تلقائي
            </Button>

            {isApiUnavailable && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                الخادم غير متاح حالياً — يمكنك تجربة العرض التجريبي بالضغط على زر "تسجيل سريع تلقائي".
              </div>
            )}
            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                ليس لديك حساب؟{' '}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            نظام سلامتي © 2025 - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
