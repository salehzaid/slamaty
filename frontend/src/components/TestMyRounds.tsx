import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';

const TestMyRounds: React.FC = () => {
  const { user } = useAuth();
  const [myRounds, setMyRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyRounds = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMyRounds();
        console.log('My Rounds API Response:', response);
        setMyRounds(Array.isArray(response) ? response : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching my rounds:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMyRounds();
    }
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">اختبار جولاتي</h1>
      
      <div className="mb-4">
        <p><strong>المستخدم الحالي:</strong> {user ? `${user.first_name} ${user.last_name} (ID: ${user.id})` : 'غير مسجل دخول'}</p>
        <p><strong>حالة التحميل:</strong> {loading ? 'جاري التحميل...' : 'تم التحميل'}</p>
        <p><strong>خطأ:</strong> {error || 'لا يوجد خطأ'}</p>
        <p><strong>عدد الجولات:</strong> {myRounds.length}</p>
      </div>

      {myRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">الجولات المخصصة لي:</h2>
          <div className="space-y-4">
            {myRounds.map((round: any) => (
              <div key={round.id} className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-bold">{round.title}</h3>
                <p><strong>الكود:</strong> {round.round_code}</p>
                <p><strong>المخصص لـ:</strong> {round.assigned_to}</p>
                <p><strong>الحالة:</strong> {round.status}</p>
                <p><strong>الأولوية:</strong> {round.priority}</p>
                <p><strong>القسم:</strong> {round.department}</p>
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

      {!loading && !error && myRounds.length === 0 && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-700">لا توجد جولات مخصصة لك</p>
        </div>
      )}
    </div>
  );
};

export default TestMyRounds;
