import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import {
  CreditCard,
  Search,
  Lock,
  Unlock,
  XCircle,
  X,
  Shield,
} from 'lucide-react';

export default function AllAccounts() {
  const { addToast } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state (12 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Status update modal
  const [targetAccount, setTargetAccount] = useState(null);
  const [newStatus, setNewStatus] = useState('active');
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      let endpoint = '/manager/accounts?';
      if (statusFilter) endpoint += `status=${statusFilter}&`;
      if (typeFilter) endpoint += `type=${typeFilter}&`;
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(endpoint);
      setAccounts(res.accounts || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [statusFilter, typeFilter, search]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!targetAccount) return;
    setActionLoading(true);

    try {
      const res = await api.put(`/manager/accounts/${targetAccount.account_number}/status`, {
        status: newStatus,
        reason: reason || 'Manager Administrative Action',
      });
      addToast(res.message, 'success');
      setTargetAccount(null);
      setReason('');
      fetchAccounts();
    } catch (err) {
      addToast(err.message || 'Status update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Slice for 12-row pagination
  const paginatedAccounts = accounts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white">All Bank Accounts Portfolio</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Search and manage customer accounts across Active, Frozen, and Closed statuses.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800/80 p-4 rounded-3xl border border-slate-700/80 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Search Account / Customer
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, account #, or email..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Status (Active / Frozen / Closed)
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="frozen">Frozen (Freeze)</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Account Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Types</option>
            <option value="savings">Savings (6% APY)</option>
            <option value="business">Business (9% APY)</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No accounts matching search criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-900/60 border-b border-slate-700/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Account Number</th>
                    <th className="py-3.5 px-4 sm:px-6">Customer</th>
                    <th className="py-3.5 px-4 sm:px-6">Type & Rate</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Balance (₹)</th>
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedAccounts.map((acc) => (
                    <tr key={acc.account_number} className="hover:bg-slate-700/30 transition">
                      <td className="py-4 px-4 sm:px-6 font-mono text-white font-bold whitespace-nowrap">
                        #{acc.account_number}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-white">{acc.owner_name}</div>
                        <div className="text-[11px] text-slate-400">{acc.owner_email}</div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          acc.account_type === 'Savings'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {acc.account_type} ({acc.account_type === 'Savings' ? '6%' : '9%'})
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right font-extrabold text-white text-sm font-mono whitespace-nowrap">
                        ₹{acc.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                          acc.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : acc.status === 'frozen'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setTargetAccount(acc);
                            setNewStatus(acc.status === 'active' ? 'frozen' : 'active');
                          }}
                          className="px-3 py-1 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-600 transition text-xs font-medium"
                        >
                          Change Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 12-Row Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={accounts.length}
              itemsPerPage={rowsPerPage}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        )}
      </div>

      {/* Status Modification Modal (Manager Only) */}
      {targetAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md mx-3 sm:mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setTargetAccount(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Update Account Status</h3>
                <p className="text-xs text-slate-400">
                  Account #{targetAccount.account_number} ({targetAccount.owner_name})
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select New Status (3 Options)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'active', label: 'Active', icon: Unlock, color: 'text-emerald-400' },
                    { id: 'frozen', label: 'Frozen', icon: Lock, color: 'text-rose-400' },
                    { id: 'closed', label: 'Closed', icon: XCircle, color: 'text-slate-400' },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setNewStatus(s.id)}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                          newStatus === s.id
                            ? 'border-purple-500 bg-purple-500/20 text-white font-bold ring-1 ring-purple-500'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${s.color}`} />
                        <span className="text-xs font-semibold">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Audit Reason / Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Compliance request, customer dispute, account closure request..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetAccount(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 font-bold rounded-xl text-xs text-white transition bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30"
                >
                  {actionLoading ? 'Updating...' : `Set to ${newStatus.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
