import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import Pagination from '../../components/Pagination';
import {
  FileText,
  Search,
  Receipt,
  Landmark,
  Download,
  CheckCircle2,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function Statements() {
  const [searchParams] = useSearchParams();
  const initialAcc = searchParams.get('account') || '';

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAcc, setSelectedAcc] = useState(initialAcc);
  const [selectedType, setSelectedType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination state (12 rows per page)
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12;

  // Receipt modal state
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      let endpoint = '/transactions/history?limit=300';
      if (selectedAcc) endpoint += `&account_number=${selectedAcc}`;
      if (selectedType) endpoint += `&type=${selectedType}`;

      const [txnRes, accRes] = await Promise.all([
        api.get(endpoint),
        api.get('/accounts/my-accounts'),
      ]);

      setTransactions(txnRes.transactions || []);
      setAccounts(accRes.accounts || []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedAcc, selectedType]);

  const filteredTxns = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.reference && t.reference.toLowerCase().includes(q)) ||
      (t.transaction_id && t.transaction_id.toLowerCase().includes(q)) ||
      t.account_number.includes(q)
    );
  });

  // Slice for 12-row pagination
  const paginatedTxns = filteredTxns.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Generate and download printable PDF receipt
  const handleDownloadPdf = () => {
    if (!selectedTxn) return;
    const isCredit = selectedTxn.type === 'deposit' || selectedTxn.type === 'transfer_in' || selectedTxn.type === 'interest';
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to download your receipt.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt_${selectedTxn.transaction_id}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1e293b;
            background: #fff;
          }
          .receipt-box {
            max-width: 600px;
            margin: 0 auto;
            border: 2px solid #0271c4;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            position: relative;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #cbd5e1;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .bank-name {
            font-size: 24px;
            font-weight: 800;
            color: #0271c4;
            letter-spacing: 1px;
            margin: 0;
          }
          .sub-title {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .status-badge {
            display: inline-block;
            background: #dcfce7;
            color: #15803d;
            font-size: 12px;
            font-weight: bold;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-top: 10px;
          }
          .amount-box {
            text-align: center;
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            border: 1px solid #e2e8f0;
          }
          .amount-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }
          .amount-val {
            font-size: 32px;
            font-weight: 800;
            color: ${isCredit ? '#16a34a' : '#dc2626'};
            margin: 6px 0 0 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
          }
          .row-label {
            color: #64748b;
          }
          .row-val {
            font-weight: 600;
            color: #0f172a;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px dashed #cbd5e1;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .receipt-box { box-shadow: none; border: 1px solid #cbd5e1; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h1 class="bank-name">APEX BANKING SYSTEM</h1>
            <div class="sub-title">Official Electronic Transaction Receipt</div>
            <div class="status-badge">✓ TRANSACTION COMPLETED</div>
          </div>

          <div class="amount-box">
            <div class="amount-label">Transaction Amount</div>
            <div class="amount-val">${isCredit ? '+' : '-'}₹${selectedTxn.amount.toFixed(2)}</div>
          </div>

          <div class="row">
            <span class="row-label">Transaction Reference ID:</span>
            <span class="row-val">${selectedTxn.transaction_id}</span>
          </div>
          <div class="row">
            <span class="row-label">Date & Time:</span>
            <span class="row-val">${new Date(selectedTxn.timestamp).toLocaleString()}</span>
          </div>
          <div class="row">
            <span class="row-label">Account Number:</span>
            <span class="row-val">#${selectedTxn.account_number}</span>
          </div>
          <div class="row">
            <span class="row-label">Transaction Type:</span>
            <span class="row-val" style="text-transform: uppercase;">${selectedTxn.type.replace('_', ' ')}</span>
          </div>
          <div class="row">
            <span class="row-label">Payment Description:</span>
            <span class="row-val">${selectedTxn.reference || 'Funds Transfer / Payment'}</span>
          </div>
          ${selectedTxn.fee > 0 ? `
          <div class="row">
            <span class="row-label">Processing Fee:</span>
            <span class="row-val">₹${selectedTxn.fee.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="row" style="border-bottom: none;">
            <span class="row-label">Post-Transaction Balance:</span>
            <span class="row-val">₹${selectedTxn.balance_after?.toFixed(2)}</span>
          </div>

          <div class="footer">
            <p>This is a computer-generated official banking receipt. No signature is required.</p>
            <p>Apex Banking System • 24/7 Customer Care • support@apexbank.com</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Account Statements & History</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Complete transaction ledger with search, category filtering, and official digital receipts.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-800/80 p-4 sm:p-5 rounded-3xl border border-slate-700/80 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Filter by Account
          </label>
          <select
            value={selectedAcc}
            onChange={(e) => setSelectedAcc(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.account_number} value={a.account_number}>
                {a.account_type} Account (#{a.account_number})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Transaction Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
            <option value="transfer_out">Transfers (Outgoing)</option>
            <option value="transfer_in">Transfers (Incoming)</option>
            <option value="interest">Interest Credits</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Search Memo / ID
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reference or txn id..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800/80 rounded-3xl border border-slate-700/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTxns.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No matching transactions found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-900/60 border-b border-slate-700/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Transaction ID</th>
                    <th className="py-3.5 px-4 sm:px-6">Date & Time</th>
                    <th className="py-3.5 px-4 sm:px-6">Account</th>
                    <th className="py-3.5 px-4 sm:px-6">Type & Memo</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Amount (₹)</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Balance After</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedTxns.map((txn) => {
                    const isCredit =
                      txn.type === 'deposit' || txn.type === 'transfer_in' || txn.type === 'interest';
                    return (
                      <tr key={txn._id || txn.transaction_id} className="hover:bg-slate-700/30 transition">
                        <td className="py-4 px-4 sm:px-6 font-mono text-slate-300 font-medium whitespace-nowrap">
                          {txn.transaction_id}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-slate-400 whitespace-nowrap">
                          {new Date(txn.timestamp).toLocaleDateString()}{' '}
                          <span className="text-[10px] text-slate-500">
                            {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-4 px-4 sm:px-6 font-mono text-slate-300 whitespace-nowrap">
                          #{txn.account_number}
                        </td>
                        <td className="py-4 px-4 sm:px-6">
                          <span className="font-semibold text-white block">
                            {txn.reference || txn.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {txn.type.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Explicit Green for Credit (+₹) and Red for Debit (-₹) */}
                        <td className={`py-4 px-4 sm:px-6 text-right font-extrabold tabular-nums text-sm whitespace-nowrap ${
                          isCredit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isCredit ? '+' : '-'}₹{txn.amount.toFixed(2)}
                          {txn.fee > 0 && (
                            <span className="block text-[10px] text-amber-400 font-normal">
                              Fee: ₹{txn.fee.toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right font-mono text-slate-300 tabular-nums whitespace-nowrap">
                          ₹{txn.balance_after?.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <button
                            onClick={() => setSelectedTxn(txn)}
                            className="p-2 hover:bg-slate-700 text-brand-400 hover:text-brand-300 rounded-lg transition"
                            title="View / Download Digital Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 12-Row Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredTxns.length}
              itemsPerPage={rowsPerPage}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </>
        )}
      </div>

      {/* Official Bank PDF Receipt Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-lg mx-3 sm:mx-auto bg-white text-slate-900 rounded-3xl p-5 sm:p-8 shadow-2xl relative border-4 border-brand-500/20 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTxn(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="text-center border-b pb-4 mb-6">
              <div className="inline-flex p-3 bg-brand-50 text-brand-600 rounded-2xl mb-2">
                <Landmark className="w-7 h-7" />
              </div>
              <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">APEX BANKING SYSTEM</h2>
              <p className="text-xs text-slate-500">Official Electronic Payment Receipt</p>
              <span className="inline-block mt-2 px-3 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                ✓ SUCCESSFUL TRANSACTION
              </span>
            </div>

            {/* Amount Banner */}
            <div className="bg-slate-50 rounded-2xl p-4 text-center mb-6 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Transaction Amount
              </span>
              <div className={`text-3xl font-extrabold mt-1 font-mono ${
                selectedTxn.type === 'deposit' || selectedTxn.type === 'transfer_in' || selectedTxn.type === 'interest'
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}>
                {selectedTxn.type === 'deposit' || selectedTxn.type === 'transfer_in' || selectedTxn.type === 'interest' ? '+' : '-'}₹{selectedTxn.amount.toFixed(2)}
              </div>
            </div>

            {/* Details Table */}
            <div className="space-y-3 text-xs mb-6 divide-y divide-slate-100">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTxn.transaction_id}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-medium text-slate-900">{new Date(selectedTxn.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Account Number:</span>
                <span className="font-mono font-bold text-slate-900">#{selectedTxn.account_number}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Transaction Type:</span>
                <span className="font-semibold uppercase text-slate-900">{selectedTxn.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Reference:</span>
                <span className="font-medium text-right max-w-[220px] truncate text-slate-900">{selectedTxn.reference || 'Funds Transfer'}</span>
              </div>
              {selectedTxn.fee > 0 && (
                <div className="flex justify-between py-1.5 text-amber-700 font-semibold">
                  <span>Withdrawal Processing Fee:</span>
                  <span>₹{selectedTxn.fee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-900">
                <span>Updated Account Balance:</span>
                <span className="font-mono">₹{selectedTxn.balance_after?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setSelectedTxn(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
