import React from 'react'
import { Link } from 'react-router-dom'

const TestRegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">اختبار صفحة التسجيل</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
            <h3 className="font-semibold text-green-800">✅ تم إنشاء صفحة التسجيل بنجاح!</h3>
            <p className="text-green-700 text-sm mt-1">
              صفحة التسجيل مع Google OAuth جاهزة للاستخدام
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">الميزات المضافة:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• تسجيل جديد مع Google OAuth</li>
              <li>• نموذج تسجيل شامل</li>
              <li>• واجهة مستخدم عربية</li>
              <li>• ربط مع API الخادم الخلفي</li>
            </ul>
          </div>

          <div className="flex space-x-4">
            <Link 
              to="/login" 
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-center hover:bg-blue-600 transition"
            >
              تسجيل الدخول
            </Link>
            <Link 
              to="/" 
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded text-center hover:bg-gray-600 transition"
            >
              الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestRegisterPage
