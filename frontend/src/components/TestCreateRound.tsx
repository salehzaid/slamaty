import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

const TestCreateRound: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const createTestRound = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // First, try to get users to get a valid user ID
      const users = await apiClient.getUsers();
      console.log('Users:', users);
      
      if (!users || users.length === 0) {
        throw new Error('لا توجد مستخدمين في النظام');
      }

      const testRound = {
        title: 'جولة اختبار مكافحة العدوى',
        description: 'جولة للتأكد من تطبيق معايير مكافحة العدوى',
        round_type: 'infection_control',
        department: 'التمريض',
        assigned_to: [users[0].id], // Use first user's ID
        scheduled_date: new Date().toISOString(),
        priority: 'high',
        notes: 'جولة مهمة للتأكد من سلامة المرضى',
        evaluation_items: []
      };

      console.log('Creating round with data:', testRound);
      
      const response = await apiClient.createRound(testRound);
      console.log('Round created:', response);
      
      setResult(response);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">اختبار إنشاء جولة</h1>
      
      <div className="mb-4">
        <p><strong>المستخدم الحالي:</strong> {user ? `${user.first_name} ${user.last_name} (${user.role})` : 'غير مسجل دخول'}</p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={createTestRound} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء جولة اختبار'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
          <p className="text-red-700">خطأ: {error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-100 border border-green-400 rounded">
          <h2 className="text-lg font-semibold mb-2">تم إنشاء الجولة بنجاح!</h2>
          <div className="space-y-2 text-sm">
            <p><strong>العنوان:</strong> {result.title}</p>
            <p><strong>كود الجولة:</strong> {result.round_code}</p>
            <p><strong>التاريخ المجدول:</strong> {result.scheduled_date}</p>
            <p><strong>المسؤول:</strong> {result.assigned_to}</p>
            <p><strong>القسم:</strong> {result.department}</p>
            <p><strong>الحالة:</strong> {result.status}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCreateRound;
