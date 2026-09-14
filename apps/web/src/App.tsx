import React, { useState } from 'react';
import { useAuthStore } from './store/auth.store';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
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

  // If user is not logged in, render the login view
  if (!token || !user) {
    return <Login />;
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
