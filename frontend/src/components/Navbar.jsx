import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Shield, User, LogOut, Clock, Timer, AlertTriangle, Menu, X } from 'lucide-react';

export default function Navbar({ mobileNavOpen, setMobileNavOpen }) {
  const { user, logout, isCustomer, isManager, timeRemainingSeconds } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (isManager) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isManager]);

  // Format MM:SS for customer reverse countdown
  const formatTime = (totalSeconds) => {
    const safeSec = Math.max(0, totalSeconds);
    const mins = Math.floor(safeSec / 60);
    const secs = safeSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isCriticalTime = timeRemainingSeconds <= 20;

  return (
    <header className="h-16 bg-slate-800/95 border-b border-slate-700/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left brand logo & Mobile Menu Toggle */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="lg:hidden p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/70 transition"
          aria-label="Toggle Navigation Menu"
        >
          {mobileNavOpen ? <X className="w-5 h-5 text-brand-400" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20 flex-shrink-0">
          <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">APEX</span>
            <span className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              BANKING
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium hidden xs:block">Enterprise Core</p>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
        {/* Manager Live Clock */}
        {isManager && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-900/60 rounded-lg border border-slate-700/50 text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        )}

        {/* Customer 5-Minute Reverse Countdown Timer */}
        {isCustomer && (
          <div
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border font-mono text-xs font-bold transition-all duration-300 ${
              isCriticalTime
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse shadow-lg shadow-rose-500/20'
                : 'bg-slate-900/80 text-emerald-400 border-slate-700/80'
            }`}
            title={isCriticalTime ? 'Session expiring soon!' : 'Session inactivity timer'}
          >
            {isCriticalTime ? (
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 animate-bounce" />
            ) : (
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            )}
            <span className="text-xs sm:text-sm tracking-wider">
              {formatTime(timeRemainingSeconds)}
            </span>
            <span className="text-[10px] font-sans font-medium uppercase text-slate-400 hidden md:inline">
              Session
            </span>
          </div>
        )}

        {/* Role Badge */}
        <div className="hidden sm:flex items-center space-x-2">
          {isManager ? (
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Manager</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold">
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </span>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-3 border-l border-slate-700/80 pl-2 sm:pl-4">
          <div className="hidden lg:block text-right">
            <div className="text-sm font-medium text-white leading-tight max-w-[140px] truncate">{user?.name}</div>
            <div className="text-[11px] text-slate-400 max-w-[140px] truncate">{user?.email}</div>
          </div>

          <button
            onClick={() => logout('Logged out successfully')}
            title="Sign Out"
            className="p-2 bg-slate-700/50 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-lg border border-slate-600/60 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
