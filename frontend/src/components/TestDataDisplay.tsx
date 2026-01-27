import React from 'react';
import { useRounds } from '@/hooks/useRounds';

const TestDataDisplay: React.FC = () => {
  const { data: rounds, loading, error } = useRounds();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">اختبار البيانات</h1>
      
      <div className="mb-4">
        <p><strong>حالة التحميل:</strong> {loading ? 'جاري التحميل...' : 'تم التحميل'}</p>
        <p><strong>خطأ:</strong> {error || 'لا يوجد خطأ'}</p>
        <p><strong>عدد الجولات:</strong> {rounds?.length || 0}</p>
      </div>

      {rounds && rounds.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">الجولات:</h2>
          <ul>
            {rounds.slice(0, 5).map((round: any) => (
              <li key={round.id} className="mb-2 p-2 bg-gray-100 rounded">
                <strong>{round.title}</strong> - {round.status}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">خطأ في تحميل البيانات: {error}</p>
        </div>
      )}
    </div>
  );
};

export default TestDataDisplay;
