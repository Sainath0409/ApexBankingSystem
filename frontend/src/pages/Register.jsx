import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Landmark, Lock, Mail, User, Phone, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'customer',
  });
  const [loading, setLoading] = useState(false);

  const { login, addToast } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post('/auth/register', formData);
      login(data.token, data.user);
      if (data.user.role === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-3 sm:px-4 py-8 sm:py-12 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-xl shadow-brand-500/25 mb-3 sm:mb-4">
            <Landmark className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Create Apex Account</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Select your access level and setup your credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Role & Access Tier
            </label>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'customer' }))}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                  formData.role === 'customer'
                    ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Customer / Client</span>
                  {formData.role === 'customer' && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                </div>
                <span className="text-[11px] text-slate-400">Personal Banking & 5-Min Timeout</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'manager' }))}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                  formData.role === 'manager'
                    ? 'border-purple-500 bg-purple-500/10 text-white ring-1 ring-purple-500'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">Bank Manager</span>
                  {formData.role === 'manager' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                </div>
                <span className="text-[11px] text-slate-400">Bank-wide Admin & Audit Logs</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Johnathan Doe"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="customer@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition duration-150 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
