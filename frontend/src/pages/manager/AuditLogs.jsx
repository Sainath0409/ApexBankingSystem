import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import {
  ShieldAlert,
  Search,
  Tag,
} from 'lucide-react';

function AuditPayloadBadge({ details }) {
  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
    return <span className="text-slate-500 italic text-[11px]">No payload data</span>;
  }

  // Format currency keys nicely
  const formatValue = (key, val) => {
    if (typeof val === 'number') {
      if (['amount', 'new_balance', 'fee', 'interest', 'total_interest_paid', 'initial_deposit'].includes(key)) {
        return `₹${val.toFixed(2)}`;
      }
      return val.toString();
    }
    if (typeof val === 'boolean') return val ? 'True' : 'False';
    return String(val);
  };

  const formatKey = (k) => {
    return k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="flex flex-wrap gap-1.5 max-w-md py-1">
      {Object.entries(details).map(([k, v]) => (
        <span
          key={k}
          className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] text-slate-300 space-x-1"
        >
          <span className="text-slate-400 font-medium">{formatKey(k)}:</span>
          <strong className="text-purple-300 font-mono">{formatValue(k, v)}</strong>
        </span>
      ))}
    </div>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination state (12 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manager/audit-logs?limit=300');
      setLogs(res.audit_logs || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.user_email?.toLowerCase().includes(q) ||
      log.ip_address?.toLowerCase().includes(q) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(q)
    );
  });

  // Slice for 12-row pagination
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">System Security & Audit Trail</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable regulatory compliance log of all transactions, authentication, and state changes.
          </p>
        </div>
      </div>

      {/* Search toolbar */}
      <div className="bg-slate-800/80 p-4 rounded-3xl border border-slate-700/80 shadow-xl max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search action, email, payload, or IP..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No audit logs found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[780px]">
                <thead className="bg-slate-900/60 border-b border-slate-700/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                    <th className="py-3.5 px-4 sm:px-6">Action</th>
                    <th className="py-3.5 px-4 sm:px-6">Initiator</th>
                    <th className="py-3.5 px-4 sm:px-6">IP Address</th>
                    <th className="py-3.5 px-4 sm:px-6">Structured Details / Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-700/30 transition">
                      <td className="py-4 px-4 sm:px-6 text-slate-400 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 sm:px-6 font-bold text-white whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-mono text-[11px] border border-purple-500/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-300 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.user_email || 'anonymous'}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{log.role}</div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-400 font-mono whitespace-nowrap">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <AuditPayloadBadge details={log.details} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 12-Row Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredLogs.length}
              itemsPerPage={rowsPerPage}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        )}
      </div>
    </div>
  );
}
