import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  CreditCard,
  Plus,
  Shield,
  X,
  ArrowRight,
} from 'lucide-react';

export default function MyAccounts() {
  const { addToast } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // New account form state
  const [accountType, setAccountType] = useState('savings');
  const [initialDeposit, setInitialDeposit] = useState('100.00');
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/accounts/my-accounts');
      setAccounts(res.accounts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.post('/accounts/create', {
        account_type: accountType,
        initial_deposit: parseFloat(initialDeposit),
      });

      addToast(res.message || 'Account opened successfully!', 'success');
      setModalOpen(false);
      fetchAccounts();
    } catch (err) {
      addToast(err.message || 'Failed to create account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Bank Accounts & Portfolios</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your Savings (6% APY) and Business (9% APY) accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setAccountType('savings');
            setInitialDeposit('100.00');
            setModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Account</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div
              key={acc.account_number}
              className="bg-slate-800/90 rounded-3xl border border-slate-700/80 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                    acc.account_type === 'Savings'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {acc.account_type} Account
                  </span>
                  <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/60">
                    #{acc.account_number}
                  </span>
                </div>

                <div className="text-xs text-slate-400">Current Balance</div>
                <div className="text-3xl font-extrabold text-white mt-1 mb-6">
                  ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Account details / rules */}
                <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-700/50 text-xs mb-6">
                  {acc.account_type === 'Savings' && (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Annual Interest Rate:</span>
                        <span className="text-emerald-400 font-semibold">6.0% APY</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Minimum Balance Rule:</span>
                        <span className="text-slate-200 font-semibold">₹{acc.minimum_balance?.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {acc.account_type === 'Business' && (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Annual Interest Rate:</span>
                        <span className="text-emerald-400 font-semibold">9.0% APY</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Withdrawal Fee:</span>
                        <span className="text-amber-400 font-semibold">₹{acc.transaction_fee?.toFixed(2)} per txn</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                <Link
                  to={`/deposit-withdraw?account=${acc.account_number}`}
                  className="px-3.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 font-semibold rounded-xl text-xs border border-brand-500/30 transition"
                >
                  Deposit / Withdraw
                </Link>
                <Link
                  to={`/statements?account=${acc.account_number}`}
                  className="text-xs text-slate-400 hover:text-slate-200 font-medium"
                >
                  Statements →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Open New Account (Only Savings and Business) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md mx-3 sm:mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-brand-500/20 text-brand-400 rounded-2xl border border-brand-500/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Open New Account</h3>
                <p className="text-xs text-slate-400">Choose between Savings (6%) or Business (9%)</p>
              </div>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountType('savings');
                      setInitialDeposit('100.00');
                    }}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      accountType === 'savings'
                        ? 'border-brand-500 bg-brand-500/20 text-white font-bold ring-1 ring-brand-500'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold text-white block">Savings Account</span>
                      <span className="text-xs text-emerald-400 font-semibold">6.0% APY</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2">₹100 min. deposit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountType('business');
                      setInitialDeposit('50.00');
                    }}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      accountType === 'business'
                        ? 'border-amber-500 bg-amber-500/20 text-white font-bold ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-sm font-bold text-white block">Business Account</span>
                      <span className="text-xs text-amber-400 font-semibold">9.0% APY</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-2">₹1.50 withdrawal fee</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Initial Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={accountType === 'savings' ? '100' : '0'}
                  required
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
                {accountType === 'savings' && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Requires minimum initial deposit of ₹100.00</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create & Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
