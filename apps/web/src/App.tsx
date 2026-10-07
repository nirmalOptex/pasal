import React, { useState } from 'react';
import { useAuthStore } from './store/auth.store';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { POS } from './pages/POS';
import { Orders } from './pages/Orders';
import { Kitchen } from './pages/Kitchen';
import { Tables } from './pages/Tables';
import { Dashboard } from './pages/Dashboard';
import { Khata } from './pages/Khata';
import { Inventory } from './pages/Inventory';
import { Menu } from './pages/Menu';
import { Reports } from './pages/Reports';
import { Employees } from './pages/Employees';

export const App: React.FC = () => {
  const { user, token } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<string>('pos');

  // Track unauthenticated view (landing page vs login view)
  const [authScreen, setAuthScreen] = useState<'landing' | 'login'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('login') === '1' || params.get('admin') || window.location.hash === '#login') {
        return 'login';
      }
    }
    return 'landing';
  });

  const [loginInitialTab, setLoginInitialTab] = useState<'pin' | 'email' | 'register'>('email');

  // If user is not logged in, render either the Landing Page or the Login Portal
  if (!token || !user) {
    if (authScreen === 'login') {
      return (
        <Login
          initialTab={loginInitialTab}
          onBackToLanding={() => {
            setAuthScreen('landing');
            if (window.location.hash === '#login') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
        />
      );
    }

    return (
      <LandingPage
        onLoginClick={(tab = 'email') => {
          setLoginInitialTab(tab);
          setAuthScreen('login');
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {currentTab === 'pos' && <POS />}
        {currentTab === 'orders' && <Orders />}
        {currentTab === 'kitchen' && <Kitchen />}
        {currentTab === 'tables' && <Tables onStartPosWithTable={() => setCurrentTab('pos')} />}
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'khata' && <Khata />}
        {currentTab === 'inventory' && <Inventory />}
        {currentTab === 'menu' && <Menu />}
        {currentTab === 'employees' && <Employees />}
        {currentTab === 'reports' && <Reports />}
      </main>
    </div>
  );
};

export default App;
