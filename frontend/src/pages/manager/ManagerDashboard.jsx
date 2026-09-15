import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Landmark,
  Users,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Percent,
  Home,
} from 'lucide-react';

export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.get('/manager/analytics');
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-purple-950/70 via-slate-800 to-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-purple-500/30 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center space-x-1">
            <Home className="w-3.5 h-3.5" />
            <span>Manager Home Center</span>
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
            Executive Operations & Bank Reserves
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time liquidity monitor, account administration, compliance audits, and customer profiles.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl sm:rounded-2xl text-xs text-purple-300 font-mono w-fit">
          <Percent className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>Savings (6% APY) & Business (9% APY)</span>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Vault Reserves</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            ₹{metrics?.total_reserves?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-400 mt-2 font-medium">Bank-wide Active Deposits</p>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Accounts</span>
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {metrics?.total_accounts}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center space-x-2">
            <span className="text-emerald-400 font-semibold">{metrics?.active_accounts} Active</span>
            <span>•</span>
            <span className="text-rose-400">{metrics?.frozen_accounts} Frozen</span>
            <span>•</span>
            <span className="text-slate-500">{metrics?.closed_accounts} Closed</span>
          </div>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Customers</span>
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {metrics?.total_customers}
          </div>
          <p className="text-xs text-slate-400 mt-2">Active Banking Profiles</p>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Transactions</span>
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {metrics?.total_transactions}
          </div>
          <p className="text-xs text-amber-400 mt-2 font-medium font-mono">
            ₹{metrics?.fees_collected?.toFixed(2)} fees collected
          </p>
        </div>
      </div>

      {/* Account Type Distribution & Flow Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white">Portfolio Distribution</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-slate-900/60 p-3.5 rounded-xl border border-blue-500/20">
              <div>
                <span className="text-blue-300 font-bold block text-sm">Savings Accounts</span>
                <span className="text-[11px] text-emerald-400 font-semibold">6.0% APY Interest</span>
              </div>
              <span className="font-extrabold text-white font-mono text-base">{metrics?.savings_count}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-3.5 rounded-xl border border-amber-500/20">
              <div>
                <span className="text-amber-300 font-bold block text-sm">Business Accounts</span>
                <span className="text-[11px] text-emerald-400 font-semibold">9.0% APY Interest (₹1.50 Fee)</span>
              </div>
              <span className="font-extrabold text-white font-mono text-base">{metrics?.business_count}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Real-Time Global Transaction Stream</h2>
            <Link to="/manager/audit" className="text-xs font-semibold text-purple-400 hover:text-purple-300">
              Audit Logs →
            </Link>
          </div>

          <div className="divide-y divide-slate-700/50">
            {metrics?.recent_transactions?.slice(0, 5).map((t) => {
              const isCredit = t.type === 'deposit' || t.type === 'transfer_in' || t.type === 'interest';
              return (
                <div key={t._id || t.transaction_id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="font-mono text-slate-400">#{t.account_number}</div>
                    <div className="text-white font-medium">{t.reference || t.type}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold font-mono ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCredit ? '+' : '-'}₹{t.amount?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
