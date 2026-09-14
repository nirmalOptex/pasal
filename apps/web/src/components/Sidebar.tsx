import React from 'react';
import {
  Coffee,
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  ChefHat,
  Grid,
  Package,
  BookOpen,
  Users,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { id: 'pos', label: 'POS Terminal', icon: UtensilsCrossed },
    { id: 'orders', label: 'Live Orders', icon: Receipt },
    { id: 'kitchen', label: 'Kitchen (KOT)', icon: ChefHat },
    { id: 'tables', label: 'Tables & Areas', icon: Grid },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'khata', label: 'Customer Khata', icon: BookOpen },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'menu', label: 'Menu & Pricing', icon: Coffee },
    { id: 'employees', label: 'Staff & Roles', icon: Users },
    { id: 'reports', label: 'Sales Reports', icon: TrendingUp },
  ];

  return (
    <aside className="w-64 bg-stone-900 text-stone-200 flex flex-col justify-between border-r border-stone-800 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-stone-800/80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/30">
            <Coffee className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-white">ChiyaPasal</h1>
            <p className="text-xs text-amber-400 font-medium">Smart Cafe & POS</p>
          </div>
        </div>

        {/* Business & Branch Info */}
        <div className="px-5 py-3 bg-stone-950/40 text-xs border-b border-stone-800/60">
          <p className="text-stone-400 font-medium truncate">{user?.businessName || 'Chiya Pasal'}</p>
          <p className="text-amber-500 font-semibold truncate">{user?.branchName || 'Main Branch'}</p>
        </div>

        {/* Nav Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-700/20'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-stone-800/80 bg-stone-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-stone-200 text-xs font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || 'CP'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-stone-200 truncate">{user?.name}</p>
              <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-md text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
