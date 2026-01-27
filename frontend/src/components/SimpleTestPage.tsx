import React from 'react';

const SimpleTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">صفحة اختبار بسيطة</h1>
          <p className="text-lg text-gray-600 mb-6">هذه صفحة اختبار للتأكد من أن التصميم يعمل بشكل صحيح.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">بطاقة 1</h3>
              <p>محتوى البطاقة الأولى</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">بطاقة 2</h3>
              <p>محتوى البطاقة الثانية</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">بطاقة 3</h3>
              <p>محتوى البطاقة الثالثة</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">قائمة العناصر</h2>
            <ul className="space-y-2">
              <li className="p-3 bg-white rounded-lg shadow">عنصر 1</li>
              <li className="p-3 bg-white rounded-lg shadow">عنصر 2</li>
              <li className="p-3 bg-white rounded-lg shadow">عنصر 3</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTestPage;
