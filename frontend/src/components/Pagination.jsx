import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 12,
  onPageChange,
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  if (totalItems <= itemsPerPage && currentPage === 1) {
    return (
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700/60 text-xs text-slate-400 bg-slate-900/30">
        <span>Showing {totalItems} of {totalItems} entries</span>
        <span className="font-medium text-slate-500">Page 1 of 1</span>
      </div>
    );
  }

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array
  const pageNumbers = [];
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-3.5 border-t border-slate-700/60 bg-slate-900/40 text-xs text-slate-300">
      <div className="text-center sm:text-left text-[11px] sm:text-xs">
        Showing <strong className="text-white font-mono">{totalItems === 0 ? 0 : startIdx}</strong> to{' '}
        <strong className="text-white font-mono">{endIdx}</strong> of{' '}
        <strong className="text-white font-mono">{totalItems}</strong> entries
      </div>

      <div className="flex items-center space-x-1 sm:space-x-1.5 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 border border-slate-700/80 transition text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-mono font-bold text-xs transition flex items-center justify-center ${
              p === currentPage
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 border border-slate-700/80 transition text-xs"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
