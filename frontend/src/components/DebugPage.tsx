import React from 'react'

const DebugPage: React.FC = () => {
  console.log('DebugPage is rendering')
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">صفحة الاختبار</h1>
      <p className="text-gray-600">هذه صفحة اختبار لضمان عمل المكونات</p>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">إذا كنت ترى هذا النص، فالمكونات تعمل بشكل صحيح!</p>
      </div>
    </div>
  )
}

export default DebugPage
