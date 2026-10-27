import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Phase 1 Pages
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import AttendancePage from './pages/AttendancePage';
import LeavesPage from './pages/LeavesPage';
import PayrollPage from './pages/PayrollPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import LoginPage from './pages/LoginPage';

// Phase 2 Pages
import AttritionDashboardPage from './pages/AttritionDashboardPage';
import ForecastingPage from './pages/ForecastingPage';
import InterventionsPage from './pages/InterventionsPage';
import DatasetsPage from './pages/DatasetsPage';

// Phase 3 Pages (Advanced Enterprise Features)
import TasksPage from './pages/TasksPage';
import PerformancePage from './pages/PerformancePage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-[#ebf1f7] overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto bg-[#ebf1f7]">
          {/* Phase 1 Modules */}
          {activeTab === 'dashboard' && <DashboardPage setActiveTab={setActiveTab} />}
          {activeTab === 'employees' && <EmployeesPage />}
          {activeTab === 'departments' && <DepartmentsPage />}
          {activeTab === 'attendance' && <AttendancePage />}
          {activeTab === 'leaves' && <LeavesPage />}
          {activeTab === 'payroll' && <PayrollPage />}
          {activeTab === 'chat' && <ChatPage />}
          {activeTab === 'documents' && <DocumentsPage />}

          {/* Phase 2 Modules (AI Attrition Intelligence) */}
          {activeTab === 'attrition' && <AttritionDashboardPage setActiveTab={setActiveTab} />}
          {activeTab === 'forecasting' && <ForecastingPage />}
          {activeTab === 'interventions' && <InterventionsPage />}
          {activeTab === 'datasets' && <DatasetsPage />}

          {/* Phase 3 Modules (Advanced Enterprise Features) */}
          {activeTab === 'tasks' && <TasksPage />}
          {activeTab === 'performance' && <PerformancePage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'audit' && <AuditLogsPage />}
        </main>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
