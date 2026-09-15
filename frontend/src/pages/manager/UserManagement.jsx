import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import {
  Shield,
  User,
  Phone,
  Mail,
  X,
  CreditCard,
} from 'lucide-react';

export default function UserManagement() {
  const { addToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state (12 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Selected customer details popup state
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manager/users');
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRowClick = async (user) => {
    try {
      setDetailsLoading(true);
      const res = await api.get(`/manager/users/${user.user_id}/details`);
      setSelectedUserDetails(res);
    } catch (err) {
      addToast(err.message || 'Failed to load customer profile details', 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleUserStatus = async (user, e) => {
    e.stopPropagation();
    const nextStatus = user.status === 'active' ? 'frozen' : 'active';
    try {
      await api.put(`/manager/users/${user.user_id}/status`, { status: nextStatus });
      addToast(`User profile ${user.name} changed to ${nextStatus}.`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Failed to update user status', 'error');
    }
  };

  // Slice for 12-row pagination
  const paginatedUsers = users.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Registered Customer Profiles</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Click on any customer row to view their complete profile, linked portfolios, and detailed balances.
        </p>
      </div>

      <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No registered users found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-900/60 border-b border-slate-700/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Customer Name</th>
                    <th className="py-3.5 px-4 sm:px-6">Email Address</th>
                    <th className="py-3.5 px-4 sm:px-6">Role</th>
                    <th className="py-3.5 px-4 sm:px-6">Active Portfolios</th>
                    <th className="py-3.5 px-4 sm:px-6">Profile Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedUsers.map((u) => (
                    <tr
                      key={u.user_id}
                      onClick={() => handleRowClick(u)}
                      className="hover:bg-purple-900/20 cursor-pointer transition group"
                      title="Click to view full customer details"
                    >
                      <td className="py-4 px-4 sm:px-6 font-semibold text-white flex items-center space-x-2.5 whitespace-nowrap">
                        <div className="p-2 bg-slate-900 rounded-xl text-slate-400 group-hover:text-purple-400 transition">
                          {u.role === 'manager' ? <Shield className="w-4 h-4 text-purple-400" /> : <User className="w-4 h-4 text-brand-400" />}
                        </div>
                        <div>
                          <div className="text-white font-bold group-hover:text-purple-300 transition">{u.name}</div>
                          <div className="text-[10px] text-slate-500">Click to view details ↗</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-300 font-mono whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          u.role === 'manager'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-mono text-slate-300 font-bold whitespace-nowrap">
                        {u.active_accounts_count} accounts
                      </td>
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                          u.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {u.role !== 'manager' && (
                          <button
                            onClick={(e) => toggleUserStatus(u, e)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                              u.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 12-Row Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={users.length}
              itemsPerPage={rowsPerPage}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        )}
      </div>

      {/* Customer Details Popup Modal */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-2xl mx-3 sm:mx-auto bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-8 text-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUserDetails(null)}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Customer Profile Header */}
            <div className="flex items-center space-x-3.5 sm:space-x-4 mb-6 pb-6 border-b border-slate-800">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 font-extrabold text-lg sm:text-xl flex-shrink-0">
                {selectedUserDetails.user.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-extrabold text-white truncate">
                  {selectedUserDetails.user.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{selectedUserDetails.user.email}</span>
                  </span>
                  {selectedUserDetails.user.phone && (
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{selectedUserDetails.user.phone}</span>
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedUserDetails.user.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {selectedUserDetails.user.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Highlights in Rupee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Net Liquidity
                </span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  ₹{selectedUserDetails.total_balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Linked Portfolios
                </span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {selectedUserDetails.total_accounts}
                </span>
              </div>
            </div>

            {/* Customer's Bank Accounts List */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span>Associated Bank Portfolios</span>
              </h4>

              {selectedUserDetails.accounts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-800/40 rounded-2xl">
                  No accounts opened yet for this customer.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedUserDetails.accounts.map((acc) => (
                    <div
                      key={acc.account_number}
                      className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700/80 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-white text-sm">
                            #{acc.account_number}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            acc.account_type === 'Savings'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {acc.account_type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Interest: {((acc.interest_rate || 0) * 100).toFixed(1)}% APY | Status: {acc.status}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-white font-mono">
                          ₹{acc.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Opened {new Date(acc.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedUserDetails(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
