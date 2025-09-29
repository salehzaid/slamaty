import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api'
import { UserCreateForm } from '@/lib/validations'
import { UserRole } from '@/types'
import { UserPlus, Loader2, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1029670330917-12p1s3hoekm9jsbsogbd5041pd95lhnc.apps.googleusercontent.com'

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const { loginAsAdmin, login } = useAuth()

  const [formData, setFormData] = useState<UserCreateForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'assessor' as UserRole,
    department: '',
    phone: '',
    position: ''
  })

  // Load Google Identity Services
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) return

      // Make handleGoogleSignIn available globally for Google OAuth
      (window as any).handleGoogleSignIn = handleGoogleSignIn

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      document.head.appendChild(script)
    }

    // Load Google OAuth script with the provided client ID
    if (GOOGLE_CLIENT_ID) {
      loadGoogleScript()
    }
  }, [])

  const initializeGoogleSignIn = () => {
    if (window.google && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id') {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
        auto_select: false,
        cancel_on_tap_outside: true
      })
    }
  }

  const handleGoogleSignIn = async (response: any) => {
    try {
      setGoogleLoading(true)
      setError('')
      setSuccess('')

      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      
      // Create user data from Google response
      const googleUserData = {
        email: payload.email,
        first_name: payload.given_name || '',
        last_name: payload.family_name || '',
        username: payload.email.split('@')[0]
      }

      // Use Google Auth API
      const authResponse = await apiClient.googleAuth(googleUserData)
      
      if (authResponse.access_token) {
        // Store user data in localStorage
        localStorage.setItem('sallamaty_user', JSON.stringify(authResponse.user))
        localStorage.setItem('access_token', authResponse.access_token)
        
        if (authResponse.is_new_user) {
          setSuccess('تم إنشاء الحساب بنجاح! مرحباً بك في نظام سلامتي.')
        } else {
          setSuccess('مرحباً بعودتك! تم تسجيل الدخول بنجاح.')
        }
        
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/')
        }, 1000)
      }
    } catch (err) {
      console.error('Google sign-in error:', err)
      setError('فشل في التسجيل باستخدام جوجل: ' + ((err as Error).message || 'خطأ غير معروف'))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserCreateForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      // Transform frontend form data to backend format
      const backendUserData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,  // Convert firstName to first_name
        last_name: formData.lastName,    // Convert lastName to last_name
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
        position: formData.position
      }
      
      console.log('Registering user:', backendUserData)
      const response = await apiClient.register(backendUserData)
      console.log('Registration response:', response)
      
      setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.')
      
      // Auto login after registration
      setTimeout(async () => {
        const loginSuccess = await login(formData.email, formData.password)
        if (loginSuccess) {
          navigate('/')
        }
      }, 1000)
      
    } catch (err) {
      console.error('Registration error:', err)
      setError('فشل في التسجيل: ' + ((err as Error).message || 'خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = () => {
    loginAsAdmin()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Success/Error Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              إنشاء حساب جديد
            </CardTitle>
            <CardDescription>
              انضم إلى نظام سلامتي لإدارة جولات الجودة
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Google Sign In Button */}
            {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id' && (
              <div className="mb-6">
                <div
                  id="g_id_onload"
                  data-client_id={GOOGLE_CLIENT_ID}
                  data-callback="handleGoogleSignIn"
                  data-auto_prompt="false"
                />
                <div 
                  className="g_id_signin"
                  data-type="standard"
                  data-size="large"
                  data-theme="outline"
                  data-text="sign_in_with"
                  data-shape="rectangular"
                  data-logo_alignment="left"
                />
              </div>
            )}

            {/* Google OAuth Setup Message */}
            {(!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id') && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">إعداد Google OAuth:</h4>
                <p className="text-xs text-blue-700">
                  لإضافة تسجيل الدخول بحساب جوجل، قم بتحديث <code>GOOGLE_CLIENT_ID</code> في ملف <code>RegisterPage.tsx</code>
                </p>
              </div>
            )}

            {/* Divider */}
            {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id' && (
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">أو</span>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">الاسم الأول</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">الاسم الأخير</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="role">الدور</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessor">مقيم</SelectItem>
                    <SelectItem value="department_head">رئيس قسم</SelectItem>
                    <SelectItem value="quality_manager">مدير الجودة</SelectItem>
                    <SelectItem value="super_admin">مدير النظام</SelectItem>
                    <SelectItem value="viewer">مشاهد</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="department">القسم</Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="position">المنصب</Label>
                <Input
                  id="position"
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 ml-2" />
                    إنشاء الحساب
                  </>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                لديك حساب بالفعل؟{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  تسجيل الدخول
                </Link>
              </p>
            </div>

            {/* Admin Direct Access Link */}
            <div className="mt-4 text-center">
              <button
                onClick={handleAdminLogin}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                دخول مباشر بحساب الإدارة
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

export default RegisterPage
