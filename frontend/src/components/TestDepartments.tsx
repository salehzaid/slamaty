import React from 'react';
import { useDepartments } from '@/hooks/useDepartments';

const TestDepartments: React.FC = () => {
  const { data: departments, loading, error } = useDepartments();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">اختبار الأقسام</h1>
      
      <div className="mb-4">
        <p><strong>حالة التحميل:</strong> {loading ? 'جاري التحميل...' : 'تم التحميل'}</p>
        <p><strong>خطأ:</strong> {error || 'لا يوجد خطأ'}</p>
        <p><strong>عدد الأقسام:</strong> {departments?.length || 0}</p>
      </div>

      {departments && departments.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">الأقسام المتاحة:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-bold text-lg">{dept.name}</h3>
                <p><strong>الكود:</strong> {dept.code}</p>
                {dept.description && <p><strong>الوصف:</strong> {dept.description}</p>}
                {dept.location && <p><strong>الموقع:</strong> {dept.location}</p>}
                {dept.floor && <p><strong>الطابق:</strong> {dept.floor}</p>}
                {dept.building && <p><strong>المبنى:</strong> {dept.building}</p>}
                <p><strong>الحالة:</strong> {dept.isActive ? 'نشط' : 'غير نشط'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">خطأ في تحميل البيانات: {error}</p>
        </div>
      )}

      {!loading && !error && (!departments || departments.length === 0) && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-700">لا توجد أقسام متاحة</p>
        </div>
      )}
    </div>
  );
};

export default TestDepartments;
