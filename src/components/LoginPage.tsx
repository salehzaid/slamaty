import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/lib/api'
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react'
import LoginForm from './forms/LoginForm'
import { UserLoginForm } from '@/lib/validations'

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1029670330917-12p1s3hoekm9jsbsogbd5041pd95lhnc.apps.googleusercontent.com'

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

// No predefined users - all authentication through API

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [autoRegLoading, setAutoRegLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { login, loginAsAdmin } = useAuth()

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
      setError('فشل في تسجيل الدخول باستخدام جوجل: ' + ((err as Error).message || 'خطأ غير معروف'))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (data: UserLoginForm) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      console.log('Attempting login with:', data)
      const success = await login(data.email, data.password)
      console.log('Login success:', success)
      
      if (success) {
        console.log('Login successful, redirecting to dashboard')
        setSuccess('تم تسجيل الدخول بنجاح!')
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        setError('فشل في تسجيل الدخول - تحقق من البيانات')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('فشل في تسجيل الدخول: ' + ((err as Error).message || 'خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      console.log('Quick login with:', { email, password })
      const success = await login(email, password)
      console.log('Quick login success:', success)
      
      if (success) {
        console.log('Quick login successful, redirecting to dashboard')
        setSuccess('تم تسجيل الدخول بنجاح!')
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else {
        setError('فشل في تسجيل الدخول - تحقق من البيانات')
      }
    } catch (err) {
      console.error('Quick login error:', err)
      setError('فشل في تسجيل الدخول: ' + ((err as Error).message || 'خطأ غير معروف'))
    } finally {
      setLoading(false)
    }
  }

  const handleAutoRegister = async () => {
    try {
      setAutoRegLoading(true)
      setError('')
      setSuccess('')
      
      // Generate random user data for quick registration
      const randomId = Math.floor(Math.random() * 10000)
      const userData = {
        username: `user${randomId}`,
        email: `user${randomId}@salamaty.com`,
        password: '123456',
        confirmPassword: '123456',
        firstName: `مستخدم`,
        lastName: `${randomId}`,
        role: 'assessor',
        department: 'العيادات',
        phone: `050${randomId.toString().padStart(7, '0')}`,
        position: 'مقيم'
      }
      
      console.log('Auto-registering user:', userData)
      const response = await apiClient.register(userData)
      console.log('Registration response:', response)
      
      setSuccess('تم إنشاء حساب جديد بنجاح! يمكنك الآن تسجيل الدخول.')
      
    } catch (err) {
      console.error('Auto-registration error:', err)
      setError('فشل في التسجيل التلقائي: ' + ((err as Error).message || 'خطأ غير معروف'))
    } finally {
      setAutoRegLoading(false)
    }
  }

  const handleAdminLogin = () => {
    loginAsAdmin()
    navigate('/')
  }

  // Quick login removed - all authentication through API

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

        {/* Login Form */}
        <LoginForm 
          onSubmit={handleSubmit}
          onQuickLogin={handleQuickLogin}
          isLoading={loading || googleLoading}
          error={error}
        />

        {/* Auto Register Button */}
        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-500">أو</span>
            </div>
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full mt-4" 
            onClick={handleAutoRegister}
            disabled={loading || googleLoading || autoRegLoading}
          >
            {autoRegLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري إنشاء حساب...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                تسجيل سريع تلقائي
              </>
            )}
          </Button>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ليس لديك حساب؟{' '}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              إنشاء حساب جديد
            </a>
          </p>
        </div>

        {/* Direct Login Buttons */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-500">تسجيل دخول مباشر</span>
            </div>
          </div>
          
          {/* Admin Direct Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleQuickLogin('admin@salamaty.com', 'admin123')}
            disabled={loading || googleLoading}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            مدير محدث النظام - admin@salamaty.com
          </Button>
          
          {/* Admin Direct Access Link */}
          <div className="text-center">
            <button
              onClick={handleAdminLogin}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              دخول مباشر بحساب الإدارة (وضع البيانات الوهمية)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage