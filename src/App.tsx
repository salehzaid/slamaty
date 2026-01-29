import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { EvaluationProvider } from './context/EvaluationContext';
import { LayoutProvider } from './context/LayoutContext';
import { RTLProvider } from './components/RTLProvider';
import { ThemeProvider } from './components/ThemeProvider';
import AnimatedSidebar from './components/AnimatedSidebar';
import MainContent from './components/MainContent';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { isCapaEnabled } from './lib/features';
import RegisterPage from './components/RegisterPage';
import TestRegisterPage from './components/TestRegisterPage';
import EnhancedCapaDashboardMain from './components/dashboard/EnhancedCapaDashboardMain';
import DepartmentsManagement from './components/pages/DepartmentsManagement';
import ReportsPage from './components/pages/ReportsPage';
import TemplatesPage from './components/pages/TemplatesPage';
import SettingsPage from './components/pages/SettingsPage';
import DebugPage from './components/DebugPage';
import UsersManagement from './components/pages/UsersManagement';
import GamifiedEvaluationSystem from './components/GamifiedEvaluationSystem';
import CapaManagement from './components/pages/CapaManagement';
import EvaluateRoundPage from './components/pages/EvaluateRoundPage';
import TestApi from './components/TestApi';
import AdminModeNotification from './components/AdminModeNotification';
import UnifiedRoundsPage from './components/pages/UnifiedRoundsPage';
import UnifiedEvaluationPage from './components/pages/UnifiedEvaluationPage';
import CategoryItemMappingPage from './components/pages/CategoryItemMappingPage';

const AppContent: React.FC = () => {
  const auth = useAuth();
  console.log('📱 AppContent: auth state:', {
    exists: !!auth,
    isLoading: auth?.isLoading,
    isAuthenticated: auth?.isAuthenticated
  });

  if (!auth) {
    console.error('❌ AppContent: auth context is UNDEFINED. Check AuthProvider wrapping.');
    return (
      <div className="flex items-center justify-center h-screen bg-red-900 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="font-bold">خطأ في تهيئة النظام: AuthContext مفقود</p>
          <p className="text-xs">يرجى التأكد من أن AuthProvider يغلف تطبيق AppContent</p>
        </div>
      </div>
    );
  }

  const { isAuthenticated, logout, isLoading } = auth;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="text-xl font-bold">جاري تحميل نظام سلامتي...</p>
          <div className="text-xs text-slate-500 font-mono bg-slate-800 p-4 rounded-lg text-left">
            DEBUG INFO:
            - auth exists: {String(!!auth)}
            - isAuthenticated: {String(auth?.isAuthenticated)}
            - isLoading: {String(auth?.isLoading)}
            - user exists: {String(!!auth?.user)}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900" dir="rtl">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/test-register" element={<TestRegisterPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    );
  }

  console.log('🏁 AppContent: rendering routes. isAuthenticated:', isAuthenticated);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900" dir="rtl">
      <AdminModeNotification />
      <AnimatedSidebar onLogout={logout} />
      <MainContent onLogout={logout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Unified Rounds Route */}
          <Route path="/rounds" element={<UnifiedRoundsPage />} />
          <Route path="/rounds/list" element={<Navigate to="/rounds?tab=list" replace />} />
          <Route path="/rounds/calendar" element={<Navigate to="/rounds?tab=calendar" replace />} />
          <Route path="/rounds/my-rounds" element={<Navigate to="/rounds?tab=my-rounds" replace />} />

          <Route path="/users" element={<UsersManagement />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Unified Evaluation Route */}
          <Route path="/evaluation" element={<UnifiedEvaluationPage />} />
          <Route path="/unified-evaluation" element={<Navigate to="/evaluation?tab=dashboard" replace />} />
          <Route path="/evaluation-categories" element={<Navigate to="/evaluation?tab=categories" replace />} />

          <Route path="/evaluation-items" element={<Navigate to="/evaluation?tab=items" replace />} />

          {isCapaEnabled() && (
            <>
              <Route path="/capa" element={<CapaManagement />} />
              <Route path="/capa-dashboard" element={<EnhancedCapaDashboardMain />} />
            </>
          )}

          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/departments" element={<DepartmentsManagement />} />
          <Route path="/gamified-system" element={<GamifiedEvaluationSystem />} />
          <Route path="/evaluate/:roundId" element={<EvaluateRoundPage />} />
          <Route path="/category-mapping" element={<CategoryItemMappingPage />} />

          <Route path="/debug" element={<DebugPage />} />
          <Route path="/test-api" element={<TestApi />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </MainContent>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <RTLProvider>
        <LayoutProvider>
          <AuthProvider>
            <NotificationsProvider>
              <EvaluationProvider>
                <Router>
                  <AppContent />
                </Router>
              </EvaluationProvider>
            </NotificationsProvider>
          </AuthProvider>
        </LayoutProvider>
      </RTLProvider>
    </ThemeProvider>
  );
};

export default App;