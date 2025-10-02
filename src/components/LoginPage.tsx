import React from 'react'

// صفحة تسجيل الدخول - يتم تخطيها تلقائياً
// التسجيل التلقائي يتم في AuthContext.tsx

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center bg-white rounded-3xl shadow-2xl p-16 max-w-md">
        <div className="mb-8">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-600 mx-auto"></div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          نظام سلامتي
        </h1>
        
        <p className="text-xl text-gray-700 mb-2">
          جاري تسجيل الدخول تلقائياً...
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          admin@salamaty.com
        </p>
        
        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-700 font-semibold mb-2">
            ✨ تسجيل الدخول التلقائي مُفعّل
          </p>
          <p className="text-xs text-gray-600">
            يتم الاتصال بقاعدة البيانات وتسجيل الدخول...
          </p>
        </div>
        
        <div className="mt-6 flex items-center justify-center space-x-2 space-x-reverse">
          <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
          <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full" style={{animationDelay: '0.2s'}}></div>
          <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
