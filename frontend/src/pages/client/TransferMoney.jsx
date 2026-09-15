import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  UserCheck,
  CheckCircle2,
  Send,
  Building2,
  Repeat,
} from 'lucide-react';

export default function TransferMoney() {
  const { addToast } = useAuth();
  const [transferMode, setTransferMode] = useState('self'); // 'self' | 'interbank'
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [selfToAccount, setSelfToAccount] = useState('');
  const [interToAccount, setInterToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  
  // Recipient lookup state for inter-bank
  const [lookupLoading, setLookupLoading] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [lookupError, setLookupError] = useState('');

  const [loading, setLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await api.get('/accounts/my-accounts');
        const accs = res.accounts || [];
        setAccounts(accs);
        if (accs.length > 0) {
          setFromAccount(accs[0].account_number);
          if (accs.length > 1) {
            setSelfToAccount(accs[1].account_number);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadAccounts();
  }, []);

  // Update self target account if source equals target
  useEffect(() => {
    if (transferMode === 'self') {
      const otherAccs = accounts.filter(a => a.account_number !== fromAccount);
      if (otherAccs.length > 0 && selfToAccount === fromAccount) {
        setSelfToAccount(otherAccs[0].account_number);
      }
    }
  }, [fromAccount, transferMode, accounts]);

  // Live lookup of recipient when 6 digits are typed for interbank
  useEffect(() => {
    if (transferMode === 'interbank' && interToAccount.length === 6) {
      const verifyRecipient = async () => {
        setLookupLoading(true);
        setLookupError('');
        setRecipientInfo(null);
        try {
          const res = await api.get(`/accounts/lookup/${interToAccount}`);
          setRecipientInfo(res);
        } catch (err) {
          setLookupError(err.message || 'Recipient account not found');
        } finally {
          setLookupLoading(false);
        }
      };
      verifyRecipient();
    } else {
      setRecipientInfo(null);
      setLookupError('');
    }
  }, [interToAccount, transferMode]);

  const selectedSourceAccount = accounts.find(a => a.account_number === fromAccount);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferSuccess(null);
    setLoading(true);

    const destinationAcc = transferMode === 'self' ? selfToAccount : interToAccount;

    if (!destinationAcc) {
      addToast('Please select or specify a destination account', 'error');
      setLoading(false);
      return;
    }

    if (fromAccount === destinationAcc) {
      addToast('Cannot transfer funds to the same account', 'error');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/transactions/transfer', {
        from_account_number: fromAccount,
        to_account_number: destinationAcc,
        amount: parseFloat(amount),
        reference: reference || (transferMode === 'self' ? 'Self Account Transfer' : 'Inter-Bank Transfer'),
      });

      setTransferSuccess(res);
      addToast(`Transferred ₹${parseFloat(amount).toFixed(2)} successfully!`, 'success');
      setAmount('');
      setReference('');
      if (transferMode === 'interbank') setInterToAccount('');
      
      const accRes = await api.get('/accounts/my-accounts');
      setAccounts(accRes.accounts || []);
    } catch (err) {
      addToast(err.message || 'Transfer failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eligibleSelfDestinations = accounts.filter(a => a.account_number !== fromAccount);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Funds Transfer</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Seamlessly move funds between your own accounts or send to any customer account.
        </p>
      </div>

      {/* Side-by-Side Mode Toggle (Self vs Inter-Bank) */}
      <div className="flex flex-col sm:flex-row bg-slate-800/80 p-1 sm:p-1.5 rounded-2xl border border-slate-700/80 gap-1 sm:gap-0">
        <button
          type="button"
          onClick={() => {
            setTransferMode('self');
            setTransferSuccess(null);
          }}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition ${
            transferMode === 'self'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Repeat className="w-4 h-4 flex-shrink-0" />
          <span>Self Transfer (Between Own Accounts)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTransferMode('interbank');
            setTransferSuccess(null);
          }}
          className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition ${
            transferMode === 'interbank'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 flex-shrink-0" />
          <span>Inter-Bank Transfer (To Other Customer)</span>
        </button>
      </div>

      {transferSuccess && (
        <div className="p-4 sm:p-6 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl sm:rounded-3xl text-slate-100 shadow-xl space-y-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3 text-emerald-400 font-bold">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="text-base sm:text-lg">Transfer Completed Successfully!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-slate-900/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-500/20 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Amount Sent</span>
              <span className="text-white font-extrabold text-sm sm:text-base font-mono">₹{transferSuccess.amount?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Transaction ID</span>
              <span className="font-mono text-emerald-300 text-[11px] truncate block">{transferSuccess.transaction_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Destination Acc</span>
              <span className="text-white font-mono font-bold">#{transferSuccess.to_account_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Remaining Balance</span>
              <span className="text-white font-bold font-mono">₹{transferSuccess.new_balance?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleTransfer} className="bg-slate-800/80 rounded-2xl sm:rounded-3xl border border-slate-700/80 p-4 sm:p-6 md:p-8 shadow-xl space-y-5 sm:space-y-6">
        {/* Source Account Selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Source Account (Debit From)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <button
                key={acc.account_number}
                type="button"
                onClick={() => setFromAccount(acc.account_number)}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  fromAccount === acc.account_number
                    ? 'border-brand-500 bg-brand-500/15 text-white ring-1 ring-brand-500 shadow-lg shadow-brand-500/20'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    {acc.account_type} Account
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    #{acc.account_number}
                  </div>
                </div>
                <div className="mt-3 text-base font-extrabold text-white font-mono">
                  ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Destination Account Selection based on Mode */}
        {transferMode === 'self' ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Destination Account (Credit To)
            </label>
            {eligibleSelfDestinations.length === 0 ? (
              <div className="p-4 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-400">
                You currently only have 1 active account. Open a second account or use <strong>Inter-Bank Transfer</strong> to transfer to another customer.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {eligibleSelfDestinations.map((acc) => (
                  <button
                    key={acc.account_number}
                    type="button"
                    onClick={() => setSelfToAccount(acc.account_number)}
                    className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      selfToAccount === acc.account_number
                        ? 'border-emerald-500 bg-emerald-500/15 text-white ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider">
                        {acc.account_type} Account
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        #{acc.account_number}
                      </div>
                    </div>
                    <div className="mt-3 text-base font-extrabold text-white font-mono">
                      ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Recipient 6-Digit Account Number
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                required
                value={interToAccount}
                onChange={(e) => setInterToAccount(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 400404"
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {lookupLoading && (
                <div className="absolute right-4 top-3.5">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {recipientInfo && (
              <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center space-x-2 text-xs text-purple-300 animate-in fade-in">
                <UserCheck className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>
                  Verified Beneficiary: <strong className="text-white">{recipientInfo.owner_name}</strong> ({recipientInfo.account_type} Account)
                </span>
              </div>
            )}

            {lookupError && (
              <div className="mt-2 text-xs text-rose-400">
                {lookupError}
              </div>
            )}
          </div>
        )}

        {/* Amount & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Transfer Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Payment Reference / Note
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Savings allocation, invoice, rent"
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {selectedSourceAccount?.account_type === 'Business' && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-xs text-amber-300">
            <strong>Business Account Rule:</strong> A ₹1.50 per-transaction fee applies on outgoing transfers.
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (transferMode === 'interbank' && !recipientInfo) || (transferMode === 'self' && eligibleSelfDestinations.length === 0)}
          className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition disabled:opacity-50 text-sm flex items-center justify-center space-x-2 ${
            transferMode === 'self'
              ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 shadow-brand-600/25'
              : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-purple-600/25'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{transferMode === 'self' ? 'Execute Self Transfer' : 'Execute Inter-Bank Transfer'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
