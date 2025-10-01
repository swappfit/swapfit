import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import { Sidebar } from './components/dashboard/sidebar';
import { TopNavbar } from './components/dashboard/top-navbar';
import { DashboardOverview } from './components/dashboard/dashboard-overview';
import { UserManagement } from './components/dashboard/user-management';
import { Schedules } from './components/dashboard/schedules';
import { PaymentsPlans } from './components/dashboard/payments-plans';
import { Reports } from './components/dashboard/reports';
import { GymApprovals } from './components/dashboard/gym-approvals';
import { ChallengesManagement } from './components/dashboard/challenges-management';
import { BadgeManager } from './components/dashboard/badge-manager';
import { MemberNotifications } from './components/dashboard/member-notifications';
import { AccessLogs } from './components/dashboard/access-logs';
import { SettingsPage } from './components/dashboard/settings-page';
import './App.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        return storedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Router>
      <div className={`flex h-screen bg-background ${darkMode ? 'dark' : ''}`}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar 
            onMenuClick={() => setSidebarOpen(true)} 
            darkMode={darkMode}
            onThemeToggle={() => setDarkMode(!darkMode)}
          />

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<DashboardOverview />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/schedules" element={<Schedules />} />
                <Route path="/payments-plans" element={<PaymentsPlans />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/gym-approvals" element={<GymApprovals />} />
                <Route path="/challenges" element={<ChallengesManagement />} />
                <Route path="/badges" element={<BadgeManager />} />
                <Route path="/notifications" element={<MemberNotifications />} />
                <Route path="/access-logs" element={<AccessLogs />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;