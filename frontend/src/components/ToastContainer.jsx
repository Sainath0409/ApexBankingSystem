import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X, Clock, RefreshCw, LogOut } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast, isCustomer, timeRemainingSeconds, isWarningActive, extendSession, logout } = useAuth();

  return (
    <div className="fixed top-4 sm:top-5 right-3 sm:right-5 left-3 sm:left-auto z-50 flex flex-col space-y-3 w-auto sm:w-full max-w-sm pointer-events-none">
      {/* Special 20-Second Customer Session Expiration Drawer */}
      {isCustomer && isWarningActive && timeRemainingSeconds > 0 && (
        <div className="pointer-events-auto bg-slate-900 border-2 border-rose-500 rounded-2xl shadow-2xl p-4 text-slate-100 animate-in slide-in-from-right duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/15 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 flex-shrink-0 animate-pulse mt-0.5">
              <Clock className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wide">
                  Session Expiring!
                </h4>
                <span className="font-mono text-xs font-extrabold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30">
                  {timeRemainingSeconds}s
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Your customer session will time out in <strong>{timeRemainingSeconds}s</strong> for your security. Please extend to stay active.
              </p>

              <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-slate-800">
                <button
                  onClick={extendSession}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Stay Logged In</span>
                </button>

                <button
                  onClick={() => logout('Logged out by user')}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standard App Toasts */}
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-2xl shadow-xl border text-xs text-slate-100 transition-all duration-300 animate-in slide-in-from-right ${
              isSuccess
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-200'
                : isError
                ? 'bg-slate-900/95 border-rose-500/50 text-rose-200'
                : 'bg-slate-900/95 border-brand-500/50 text-brand-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {!isSuccess && !isError && <Info className="w-4 h-4 text-brand-400" />}
            </div>

            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block text-white mb-0.5">
                {isSuccess ? 'Success' : isError ? 'Error Notice' : 'Notification'}
              </span>
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
