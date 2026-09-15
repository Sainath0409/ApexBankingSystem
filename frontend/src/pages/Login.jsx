import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Landmark, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState('');
  
  const { login, addToast } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const notice = sessionStorage.getItem('logout_reason');
    if (notice) {
      setLogoutNotice(notice);
      sessionStorage.removeItem('logout_reason');
    }
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      if (data.user.role === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err.message || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-3 sm:px-4 py-8 sm:py-12 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-xl shadow-brand-500/25 mb-3 sm:mb-4">
            <Landmark className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Apex Banking System</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Sign in to your secure banking portal</p>
        </div>

        {logoutNotice && (
          <div className="mb-6 p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-start space-x-3 text-amber-300 text-xs leading-relaxed animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Session Notice</span>
              {logoutNotice}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@apexbank.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition duration-150 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick 1-Click Demo Logins
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fillDemo('customer@apexbank.com', 'Password123!')}
              className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs transition group"
            >
              <div className="flex items-center space-x-1.5 font-semibold text-blue-400 mb-0.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Customer Demo</span>
              </div>
              <span className="text-[11px] text-slate-400 block truncate">customer@apexbank.com</span>
              <span className="text-[10px] text-emerald-400 mt-1 block">5-Min Session Active</span>
            </button>

            <button
              type="button"
              onClick={() => fillDemo('manager@apexbank.com', 'Password123!')}
              className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left text-xs transition group"
            >
              <div className="flex items-center space-x-1.5 font-semibold text-purple-400 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Manager Demo</span>
              </div>
              <span className="text-[11px] text-slate-400 block truncate">manager@apexbank.com</span>
              <span className="text-[10px] text-purple-400 mt-1 block">Executive Access</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition">
              Register New Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
