import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

const TestRoundCreation: React.FC = () => {
  const { user } = useAuth();
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testCreateRound = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const roundData = {
        title: 'جولة اختبار',
        description: 'جولة اختبار للتأكد من صحة البيانات',
        round_type: 'infection_control',
        department: 'التمريض',
        assigned_to: [1], // User ID
        scheduled_date: new Date().toISOString(),
        priority: 'medium',
        notes: 'ملاحظات اختبار',
        evaluation_items: [1, 2] // Evaluation item IDs
      };

      console.log('Sending round data:', roundData);
      
      const response = await apiClient.createRound(roundData);
      console.log('Round creation response:', response);
      
      setTestData(response);
    } catch (err) {
      console.error('Error creating round:', err);
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
          onClick={testCreateRound} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'جاري الإنشاء...' : 'إنشاء جولة اختبار'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
          <p className="text-red-700">خطأ: {error}</p>
        </div>
      )}

      {testData && (
        <div className="p-4 bg-green-100 border border-green-400 rounded">
          <h2 className="text-lg font-semibold mb-2">تم إنشاء الجولة بنجاح!</h2>
          <pre className="text-sm bg-white p-2 rounded overflow-auto">
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestRoundCreation;
