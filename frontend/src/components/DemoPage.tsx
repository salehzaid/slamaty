import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { EvaluationProvider } from '../context/EvaluationContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { LayoutProvider } from '../context/LayoutContext';
import { RTLProvider } from './RTLProvider';
import { ThemeProvider } from './ThemeProvider';
import AnimatedSidebar from './AnimatedSidebar';
import MainContent from './MainContent';
import SimpleDashboard from './SimpleDashboard';

// Mock user for demo
const mockUser = {
  id: 1,
  username: 'demo',
  email: 'demo@salamaty.com',
  first_name: 'مستخدم',
  last_name: 'تجريبي',
  role: 'super_admin',
  department: 'إدارة الجودة',
  position: 'مدير النظام',
  is_active: true
};

// Mock auth context for demo
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthValue = {
    user: mockUser,
    token: 'demo-token',
    login: async () => ({ success: true }),
    logout: () => {},
    isAuthenticated: true,
    loading: false
  };

  return (
    <div>
      {/* Inject mock auth into global context */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.mockAuth = ${JSON.stringify(mockAuthValue)};
          localStorage.setItem('token', 'demo-token');
          localStorage.setItem('user', '${JSON.stringify(mockUser)}');
        `
      }} />
      {children}
    </div>
  );
};

const DemoApp: React.FC = () => {
  useEffect(() => {
    // Set demo mode flag
    window.DEMO_MODE = true;
    
    // Override API calls for demo
    const originalFetch = window.fetch;
    window.fetch = async (url, options) => {
      // For demo, return mock data for API calls
      if (typeof url === 'string' && url.includes('/api/')) {
        return new Response(JSON.stringify({ 
          status: 'success', 
          data: [],
          message: 'Demo mode - no real API calls'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return originalFetch(url, options);
    };
  }, []);

  return (
    <RTLProvider>
      <ThemeProvider>
        <MockAuthProvider>
          <AuthProvider>
            <EvaluationProvider>
              <NotificationsProvider>
                <LayoutProvider>
                  <Router>
                    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
                      <AnimatedSidebar />
                      <div className="flex-1 flex flex-col">
                        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 text-center">
                          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg inline-block">
                            🧪 <strong>وضع التجربة</strong> - هذا عرض تجريبي للنظام
                          </div>
                        </div>
                        <MainContent>
                          <Routes>
                            <Route path="/" element={<SimpleDashboard />} />
                            <Route path="/dashboard" element={<SimpleDashboard />} />
                            <Route path="*" element={<SimpleDashboard />} />
                          </Routes>
                        </MainContent>
                      </div>
                    </div>
                  </Router>
                </LayoutProvider>
              </NotificationsProvider>
            </EvaluationProvider>
          </AuthProvider>
        </MockAuthProvider>
      </ThemeProvider>
    </RTLProvider>
  );
};

export default DemoApp;
