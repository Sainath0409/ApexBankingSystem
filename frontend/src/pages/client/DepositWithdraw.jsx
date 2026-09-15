import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  HelpCircle,
} from 'lucide-react';

export default function DepositWithdraw() {
  const [searchParams] = useSearchParams();
  const preselectedAcc = searchParams.get('account');
  const { addToast } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit' | 'withdraw'
  const [selectedAccountNum, setSelectedAccountNum] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts/my-accounts');
      const accs = res.accounts || [];
      setAccounts(accs);
      if (preselectedAcc && accs.some(a => a.account_number === preselectedAcc)) {
        setSelectedAccountNum(preselectedAcc);
      } else if (accs.length > 0) {
        setSelectedAccountNum(accs[0].account_number);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [preselectedAcc]);

  const selectedAccount = accounts.find(a => a.account_number === selectedAccountNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const numAmount = parseFloat(amount);
    const endpoint = activeTab === 'deposit' ? '/transactions/deposit' : '/transactions/withdraw';

    try {
      const res = await api.post(endpoint, {
        account_number: selectedAccountNum,
        amount: numAmount,
        reference: reference || (activeTab === 'deposit' ? 'Cash/Online Deposit' : 'Cash/ATM Withdrawal'),
      });

      addToast(res.message, 'success');
      setAmount('');
      setReference('');
      fetchAccounts();
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Deposit & Withdrawal Portal</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Perform immediate credit or debit operations across your Savings and Business accounts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800/80 p-1 sm:p-1.5 rounded-2xl border border-slate-700/80">
        <button
          type="button"
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 sm:space-x-2 transition ${
            activeTab === 'deposit'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Deposit Funds</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 sm:space-x-2 transition ${
            activeTab === 'withdraw'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Withdraw Funds</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800/80 rounded-2xl sm:rounded-3xl border border-slate-700/80 p-4 sm:p-6 md:p-8 shadow-xl space-y-5 sm:space-y-6">
        {/* Account Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target Bank Account
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <button
                key={acc.account_number}
                type="button"
                onClick={() => setSelectedAccountNum(acc.account_number)}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedAccountNum === acc.account_number
                    ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-white uppercase">{acc.account_type} Account</div>
                <div className="text-[10px] font-mono text-slate-400">#{acc.account_number}</div>
                <div className="text-base font-extrabold text-white mt-2 font-mono">
                  ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            {activeTab === 'deposit' ? 'Deposit Amount (₹)' : 'Withdrawal Amount (₹)'}
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
        </div>

        {/* Reference */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Reference / Memo (Optional)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. Salary, ATM Cash, Invoice"
            className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Dynamic rule display */}
        {selectedAccount && activeTab === 'withdraw' && (
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-700/60 text-xs space-y-2">
            <div className="flex items-center space-x-1.5 font-semibold text-slate-300">
              <HelpCircle className="w-4 h-4 text-brand-400" />
              <span>Withdrawal Rule Summary</span>
            </div>
            {selectedAccount.account_type === 'Savings' && (
              <p className="text-slate-400">
                Savings accounts require a minimum balance of <strong>₹{selectedAccount.minimum_balance?.toFixed(2)}</strong>. Maximum withdrawable right now: <strong>₹{Math.max(0, (selectedAccount.balance - selectedAccount.minimum_balance)).toFixed(2)}</strong>.
              </p>
            )}
            {selectedAccount.account_type === 'Business' && (
              <p className="text-slate-400">
                A per-transaction withdrawal fee of <strong>₹{selectedAccount.transaction_fee?.toFixed(2)}</strong> will be charged with this transaction.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedAccount}
          className={`w-full py-4 font-bold rounded-2xl shadow-xl transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2 text-white ${
            activeTab === 'deposit'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
              : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/25'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {activeTab === 'deposit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              <span>{activeTab === 'deposit' ? 'Process Immediate Deposit' : 'Process Immediate Withdrawal'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
