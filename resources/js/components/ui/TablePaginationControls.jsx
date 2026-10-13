import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

/**
 * Reusable Table Pagination Controls UI.
 */
export default function TablePaginationControls({
  currentPage,
  pageSize,
  totalPages,
  totalCount,
  filteredCount,
  onPageChange,
  onPageSizeChange,
  onJumpToPage
}) {
  const [jumpInput, setJumpInput] = useState(String(currentPage));

  useEffect(() => {
    setJumpInput(String(currentPage));
  }, [currentPage]);

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    onJumpToPage(jumpInput);
  };

  const startIdx = filteredCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(filteredCount, currentPage * pageSize);

  // Generate page numbers array with optional ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400 font-sans select-none w-full rounded-b-2xl">
      
      {/* Summary + Page size option */}
      <div className="flex flex-wrap items-center gap-4 text-left">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-400">Show</span>
          <SearchableSelect
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            aria-label="Rows per page"
            className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold cursor-pointer text-xs transition-all"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </SearchableSelect>
          <span className="text-[11px] font-semibold text-gray-400">entries</span>
        </div>
        
        <span className="text-gray-450 dark:text-gray-400 font-medium">
          Showing <strong className="text-gray-800 dark:text-gray-200">{startIdx}</strong> to <strong className="text-gray-800 dark:text-gray-200">{endIdx}</strong> of{' '}
          <strong className="text-gray-800 dark:text-gray-200">{filteredCount}</strong>{' '}
          {filteredCount !== totalCount && `(filtered from ${totalCount})`} entries
        </span>
      </div>

      {/* Page Navigation */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
            className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={idx} className="px-2 py-1 text-gray-400 font-bold">
                  ...
                </span>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={currentPage === p ? 'page' : undefined}
                className={`px-3 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  currentPage === p
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next page"
            className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Jump to Page */}
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-400">Go to page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            aria-label="Go to page number"
            className="w-12 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary font-bold text-xs"
          />
          <button
            type="submit"
            className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300 transition-colors font-bold cursor-pointer text-xs"
          >
            Go
          </button>
        </form>
      </div>

    </div>
  );
}
