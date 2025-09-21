import React from 'react';
import { useRounds } from '@/hooks/useRounds';

const TestRoundsData: React.FC = () => {
  const { data: rounds, loading, error } = useRounds();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">اختبار بيانات الجولات</h1>
      
      <div className="mb-4">
        <p><strong>حالة التحميل:</strong> {loading ? 'جاري التحميل...' : 'تم التحميل'}</p>
        <p><strong>خطأ:</strong> {error || 'لا يوجد خطأ'}</p>
        <p><strong>عدد الجولات:</strong> {rounds?.length || 0}</p>
      </div>

      {rounds && rounds.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-2">بيانات الجولات الخام:</h2>
          {rounds.map((round: any, index: number) => (
            <div key={round.id || index} className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold text-lg mb-2">الجولة #{index + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ID:</strong> {round.id}
                </div>
                <div>
                  <strong>العنوان:</strong> {round.title}
                </div>
                <div>
                  <strong>كود الجولة:</strong> {round.round_code || 'غير محدد'}
                </div>
                <div>
                  <strong>التاريخ المجدول:</strong> {round.scheduled_date || 'غير محدد'}
                </div>
                <div>
                  <strong>المسؤول:</strong> {round.assigned_to || 'غير محدد'}
                </div>
                <div>
                  <strong>القسم:</strong> {round.department || 'غير محدد'}
                </div>
                <div>
                  <strong>الحالة:</strong> {round.status || 'غير محدد'}
                </div>
                <div>
                  <strong>الأولوية:</strong> {round.priority || 'غير محدد'}
                </div>
                <div className="md:col-span-2">
                  <strong>الوصف:</strong> {round.description || 'غير محدد'}
                </div>
                <div className="md:col-span-2">
                  <strong>البيانات الكاملة:</strong>
                  <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(round, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">خطأ في تحميل البيانات: {error}</p>
        </div>
      )}

      {!loading && !error && (!rounds || rounds.length === 0) && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-700">لا توجد جولات متاحة</p>
        </div>
      )}
    </div>
  );
};

export default TestRoundsData;
