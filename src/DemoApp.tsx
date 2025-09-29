import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RTLProvider } from './components/RTLProvider';
import { ThemeProvider } from './components/ThemeProvider';
import AnimatedSidebar from './components/AnimatedSidebar';
import MainContent from './components/MainContent';
import SimpleDashboard from './components/SimpleDashboard';
import RoundsManagement from './components/pages/RoundsManagement';
import CapaManagement from './components/pages/CapaManagement';
import DepartmentsManagement from './components/pages/DepartmentsManagement';
import UsersManagement from './components/pages/UsersManagement';

const DemoApp: React.FC = () => {
  return (
    <RTLProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
            {/* Demo Banner */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 text-center py-2 px-4 font-medium">
              🧪 <strong>وضع التجربة</strong> - عرض تجريبي لنظام سلامتي (بدون تسجيل دخول)
            </div>
            
            <div className="w-full flex pt-12">
              <AnimatedSidebar />
              <div className="flex-1 flex flex-col">
                <MainContent>
                  <Routes>
                    <Route path="/" element={<SimpleDashboard />} />
                    <Route path="/dashboard" element={<SimpleDashboard />} />
                    <Route path="/rounds" element={<RoundsManagement />} />
                    <Route path="/capa" element={<CapaManagement />} />
                    <Route path="/departments" element={<DepartmentsManagement />} />
                    <Route path="/users" element={<UsersManagement />} />
                    <Route path="*" element={<SimpleDashboard />} />
                  </Routes>
                </MainContent>
              </div>
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </RTLProvider>
  );
};

export default DemoApp;
