import React from 'react';
import { LayoutDashboard, BarChart3, Settings, MessageSquare, CreditCard, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  
  const navItems = [
    { path: '/', label: 'My Bots', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/billing', label: 'Billing', icon: CreditCard },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="bg-blue-100 p-2 rounded-lg mr-3">
          <MessageSquare size={20} className="text-blue-600" />
        </div>
        <span className="font-bold text-slate-800 text-lg">TeleBot Manager</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
            const Icon = item.icon;
            return (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                        ${isActive 
                            ? 'bg-slate-100 text-slate-900' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }
                    `}
                >
                    {({ isActive }) => (
                        <>
                           <Icon size={18} className={isActive ? 'text-slate-900' : 'text-slate-400'} />
                           {item.label}
                        </>
                    )}
                </NavLink>
            );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-medium overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
            ) : (
              user?.email?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-slate-700 truncate">{user?.displayName || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
