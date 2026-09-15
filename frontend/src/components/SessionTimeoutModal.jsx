import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Clock, LogOut, RefreshCw } from 'lucide-react';

export default function SessionTimeoutModal() {
  const { showTimeoutWarning, secondsRemaining, extendSession, logout } = useAuth();

  if (!showTimeoutWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-800 border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 relative overflow-hidden">
        {/* Amber glowing background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Inactivity Warning</h3>
            <p className="text-xs text-slate-400">Security Inactivity Window (5 Minutes)</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Due to banking security regulations, your active client session will automatically terminate due to inactivity.
        </p>

        {/* Countdown display */}
        <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 mb-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Time Remaining</span>
          </div>
          <div className="text-4xl font-extrabold text-amber-400 tabular-nums">
            00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
          </div>
          <p className="text-xs text-slate-400 mt-1">Seconds until automatic logout</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => logout('Logged out by user')}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition text-sm border border-slate-600"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Now</span>
          </button>

          <button
            onClick={extendSession}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 transition text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Keep Me Signed In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
