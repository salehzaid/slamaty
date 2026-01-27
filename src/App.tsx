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

  if (!auth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const { isAuthenticated, logout, isLoading } = auth;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
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
};

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