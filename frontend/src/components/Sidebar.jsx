import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Wallet,
  FileText,
  Home,
  Users,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export default function Sidebar({ mobileNavOpen, setMobileNavOpen }) {
  const { user, isManager, logout } = useAuth();

  const customerLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Accounts', path: '/accounts', icon: CreditCard },
    { name: 'Transfer Funds', path: '/transfer', icon: ArrowLeftRight },
    { name: 'Deposit & Withdraw', path: '/deposit-withdraw', icon: Wallet },
    { name: 'Statements', path: '/statements', icon: FileText },
  ];

  const managerLinks = [
    { name: 'Home', path: '/manager/dashboard', icon: Home },
    { name: 'All Accounts', path: '/manager/accounts', icon: Users },
    { name: 'User Management', path: '/manager/users', icon: UserCheck },
    { name: 'Audit Logs', path: '/manager/audit', icon: ShieldAlert },
  ];

  const links = isManager ? managerLinks : customerLinks;

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {isManager ? 'Manager Portal' : 'Customer Banking'}
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileNavOpen && setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? isManager
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                          : 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                        : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User profile card visible on mobile drawer */}
      <div className="pt-4 border-t border-slate-700/60 lg:hidden">
        <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-bold text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0 ${
            isManager ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
          }`}>
            {isManager ? 'Manager' : 'Customer'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-800/60 border-r border-slate-700/80 min-h-[calc(100vh-4rem)] flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Over Drawer */}
      <div
        className={`fixed top-16 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
