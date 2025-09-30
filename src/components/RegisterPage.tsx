import React, { useState } from 'react'
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
import { UserPlus, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'


const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [googleLoading] = useState(false)
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
            {/* Google Sign-In removed */}

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
                    <span className="w-5 h-5 ml-2 inline-block border-2 border-current border-t-transparent rounded-full animate-spin" />
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
