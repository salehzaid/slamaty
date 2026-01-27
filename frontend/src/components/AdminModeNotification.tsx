import React from 'react';
import { Shield, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const AdminModeNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // إخفاء الإشعار تلقائياً بعد 10 ثوان
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">وضع الإدارة النشط</h3>
            <p className="text-xs text-blue-100 mt-1">
              تم تسجيل الدخول بحساب الإدارة الافتراضي
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminModeNotification;
