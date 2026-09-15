import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  PlusCircle,
  TrendingUp,
  Timer,
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination state for transactions (12 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [accRes, txnRes] = await Promise.all([
        api.get('/accounts/my-accounts'),
        api.get('/transactions/history?limit=100'),
      ]);
      setAccounts(accRes.accounts || []);
      setTransactions(txnRes.transactions || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);

  // Pagination slice
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-800 via-slate-800/80 to-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-700/80 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            Customer Banking Portal
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-1">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your personal finances, instant transfers, and active accounts.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
          <Link
            to="/accounts"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 sm:px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Open Account</span>
          </Link>
          <Link
            to="/transfer"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 sm:px-4 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-600 transition whitespace-nowrap"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer Funds</span>
          </Link>
        </div>
      </div>

      {/* Primary Balance & Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-brand-900/40 via-slate-800 to-slate-900 p-6 rounded-3xl border border-brand-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net Liquidity</span>
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-3 flex items-center space-x-2 text-xs text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across {accounts.length} active bank {accounts.length === 1 ? 'account' : 'accounts'}</span>
          </div>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Portfolios</span>
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {accounts.length}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Savings (6% APY) & Business (9% APY)
          </p>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Inactivity Window</span>
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Timer className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
            5 Min
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Fixed session countdown with 20s warning toggle
          </p>
        </div>
      </div>

      {/* Accounts List Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Your Bank Accounts</h2>
          <Link to="/accounts" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
            View Details & Rules →
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/40 rounded-3xl border border-slate-700/60">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold">No active bank accounts found</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Open your first Savings or Business account to get started.</p>
            <Link
              to="/accounts"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Account</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((acc) => (
              <div
                key={acc.account_number}
                className="bg-slate-800/90 rounded-3xl border border-slate-700/80 p-6 shadow-xl relative overflow-hidden group hover:border-brand-500/50 transition duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    acc.account_type === 'Savings'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {acc.account_type}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    #{acc.account_number}
                  </span>
                </div>

                <div className="text-xs text-slate-400">Available Balance</div>
                <div className="text-2xl font-extrabold text-white mt-0.5 mb-4">
                  ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  {acc.account_type === 'Savings' && (
                    <span className="text-slate-400">Min. Bal: ₹{acc.minimum_balance} | 6% APY</span>
                  )}
                  {acc.account_type === 'Business' && (
                    <span className="text-slate-400">Fee: ₹{acc.transaction_fee} | 9% APY</span>
                  )}
                  
                  <Link
                    to={`/deposit-withdraw?account=${acc.account_number}`}
                    className="text-brand-400 hover:text-brand-300 font-semibold"
                  >
                    Transact →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions with 12-Row Pagination & Explicit Colors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
          <Link to="/statements" className="text-xs font-semibold text-brand-400 hover:text-brand-300">
            View All Statements →
          </Link>
        </div>

        <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 overflow-hidden shadow-xl">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No recent transactions recorded yet.
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-700/60">
                {paginatedTransactions.map((txn) => {
                  const isCredit = txn.type === 'deposit' || txn.type === 'transfer_in' || txn.type === 'interest';
                  return (
                    <div key={txn._id || txn.transaction_id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-700/30 transition">
                      <div className="flex items-center space-x-3.5">
                        <div className={`p-2.5 rounded-xl ${
                          isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {txn.type === 'deposit' && <ArrowDownLeft className="w-5 h-5" />}
                          {txn.type === 'withdraw' && <ArrowUpRight className="w-5 h-5" />}
                          {txn.type === 'transfer_out' && <ArrowUpRight className="w-5 h-5" />}
                          {txn.type === 'transfer_in' && <ArrowDownLeft className="w-5 h-5" />}
                          {txn.type === 'interest' && <TrendingUp className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-white">
                            {txn.reference || txn.type.toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span>Acc #{txn.account_number}</span>
                            <span>•</span>
                            <span>{new Date(txn.timestamp).toLocaleDateString()} {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      {/* Explicit Green for Credit (+₹) and Red for Debit (-₹) */}
                      <div className="text-right">
                        <div className={`font-extrabold text-sm sm:text-base tabular-nums font-mono ${
                          isCredit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isCredit ? '+' : '-'}₹{txn.amount.toFixed(2)}
                        </div>
                        {txn.fee > 0 && (
                          <div className="text-[10px] text-amber-400 font-mono">
                            Fee: ₹{txn.fee.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 12-Row Pagination */}
              <Pagination
                currentPage={currentPage}
                totalItems={transactions.length}
                itemsPerPage={rowsPerPage}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
