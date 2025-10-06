import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
// import { EvaluationProvider } from './context/EvaluationContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { LayoutProvider } from './context/LayoutContext';
import { RTLProvider } from './components/RTLProvider';
import { ThemeProvider } from './components/ThemeProvider';
import AnimatedSidebar from './components/AnimatedSidebar';
import MainContent from './components/MainContent';
import SimpleDashboard from './components/SimpleDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import TestRegisterPage from './components/TestRegisterPage';
// Deprecated traditional CAPA components removed; use enhanced CAPA page instead
import EnhancedCapaManagement from './components/pages/EnhancedCapaManagement'
import EnhancedCapaDashboardMain from './components/dashboard/EnhancedCapaDashboardMain';
import DepartmentsManagement from './components/pages/DepartmentsManagement';
import DepartmentFormPage from './components/pages/DepartmentFormPage';
import ReportsPage from './components/pages/ReportsPage';
import MyRoundsPage from './components/pages/MyRoundsPage';
import TemplatesPage from './components/pages/TemplatesPage';
import SettingsPage from './components/pages/SettingsPage';
import DebugPage from './components/DebugPage';
import UsersManagement from './components/pages/UsersManagement';
import UnifiedEvaluationDashboard from './components/UnifiedEvaluationDashboard';
import GamifiedEvaluationSystem from './components/GamifiedEvaluationSystem';
import EvaluationCategoriesPage from './components/pages/EvaluationCategoriesPage';
import EvaluationItemsPage from './components/pages/EvaluationItemsPage';
import EvaluateRoundPage from './components/pages/EvaluateRoundPage';
import RoundsManagement from './components/pages/RoundsManagement';
import RoundsListView from './components/pages/RoundsListView';
import RoundsCalendarView from './components/pages/RoundsCalendarView';
import EvaluationCapaIntegration from './components/pages/EvaluationCapaIntegration';
import CapaIntegrationRoundSelector from './components/pages/CapaIntegrationRoundSelector';
import TestDataDisplay from './components/TestDataDisplay';
import SimpleTestPage from './components/SimpleTestPage';
import TestMyRounds from './components/TestMyRounds';
import TestDepartments from './components/TestDepartments';
import TestRoundCreation from './components/TestRoundCreation';
import TestRoundsData from './components/TestRoundsData';
import TestCreateRound from './components/TestCreateRound';
import TestApi from './components/TestApi';
import LayoutTestPage from './components/LayoutTestPage';
import AdminModeNotification from './components/AdminModeNotification';

const AppContent: React.FC = () => {
  console.log('📱 AppContent: Component loaded');
  const auth = useAuth();
  console.log('🔐 AppContent: Auth context:', auth);
  
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
    console.log('⏳ AppContent: Still loading, showing loading screen');
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
    console.log('🔒 AppContent: User not authenticated, showing login page');
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
            <Route path="/" element={<SimpleDashboard />} />
            <Route path="/dashboard" element={<SimpleDashboard />} />
            <Route path="/rounds" element={<RoundsManagement />} />
            <Route path="/rounds/list" element={<RoundsListView />} />
            <Route path="/rounds/calendar" element={<RoundsCalendarView />} />
            <Route path="/rounds/my-rounds" element={<MyRoundsPage />} />
            <Route path="/rounds/evaluate/:roundId" element={<EvaluateRoundPage />} />
            <Route path="/rounds/capa-integration" element={<CapaIntegrationRoundSelector />} />
            <Route path="/rounds/:roundId/capa-integration" element={<EvaluationCapaIntegration />} />
            {/* Deprecated traditional CAPA pages removed in favor of enhanced page */}
            {/* Routes for /capa removed. Use /capa-enhanced instead. */}
            <Route path="/capa-enhanced" element={<EnhancedCapaManagement />} />
        <Route path="/capa-dashboard" element={<EnhancedCapaDashboardMain />} />
            <Route path="/my-rounds" element={<MyRoundsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/departments" element={<DepartmentsManagement />} />
            <Route path="/departments/new" element={<DepartmentFormPage />} />
            <Route path="/departments/edit/:id" element={<DepartmentFormPage />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/unified-evaluation" element={<UnifiedEvaluationDashboard />} />
            <Route path="/evaluation-categories" element={<EvaluationCategoriesPage />} />
            <Route path="/evaluation-items" element={<EvaluationItemsPage />} />
            <Route path="/gamified-system" element={<GamifiedEvaluationSystem />} />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/test-data" element={<TestDataDisplay />} />
            <Route path="/test-simple" element={<SimpleTestPage />} />
            <Route path="/test-my-rounds" element={<TestMyRounds />} />
            <Route path="/test-departments" element={<TestDepartments />} />
            <Route path="/test-round-creation" element={<TestRoundCreation />} />
            <Route path="/test-rounds-data" element={<TestRoundsData />} />
            <Route path="/test-create-round" element={<TestCreateRound />} />
            <Route path="/test-api" element={<TestApi />} />
            <Route path="/layout-test" element={<LayoutTestPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
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
              <Router>
                <AppContent />
              </Router>
            </NotificationsProvider>
          </AuthProvider>
        </LayoutProvider>
      </RTLProvider>
    </ThemeProvider>
  );
};

export default App;