import React, { useState } from 'react';
import { apiClient } from '../lib/api';

const TestApi: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    try {
      setLoading(true);
      setResult('جاري اختبار تسجيل الدخول...');
      
      const response = await apiClient.login('admin@salamaty.com', '123456');
      setResult(`تسجيل الدخول نجح: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`خطأ في تسجيل الدخول: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetDepartments = async () => {
    try {
      setLoading(true);
      setResult('جاري اختبار جلب الأقسام...');
      
      const response = await apiClient.getDepartments();
      setResult(`جلب الأقسام نجح: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`خطأ في جلب الأقسام: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateDepartment = async () => {
    try {
      setLoading(true);
      setResult('جاري اختبار إنشاء قسم...');
      
      const departmentData = {
        name: 'قسم الاختبار من React',
        name_en: 'Test Department from React',
        code: 'REACT-TEST-' + Date.now(),
        floor: 'الاول',
        building: 'العيادات'
      };
      
      const response = await apiClient.createDepartment(departmentData);
      setResult(`إنشاء القسم نجح: ${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setResult(`خطأ في إنشاء القسم: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>اختبار API</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ padding: '10px 20px', margin: '5px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          اختبار تسجيل الدخول
        </button>
        
        <button 
          onClick={testGetDepartments} 
          disabled={loading}
          style={{ padding: '10px 20px', margin: '5px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          اختبار جلب الأقسام
        </button>
        
        <button 
          onClick={testCreateDepartment} 
          disabled={loading}
          style={{ padding: '10px 20px', margin: '5px', background: '#ffc107', color: 'black', border: 'none', borderRadius: '5px' }}
        >
          اختبار إنشاء قسم
        </button>
      </div>

      {result && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '5px',
          border: '1px solid #dee2e6',
          whiteSpace: 'pre-wrap',
          fontSize: '12px'
        }}>
          {result}
        </div>
      )}
    </div>
  );
};

export default TestApi;
