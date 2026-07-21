import { useState, useMemo, useEffect } from 'react';

/**
 * Reusable table hook for sorting, filtering, and pagination.
 */
export function useTableState({
  data = [],
  defaultPageSize = 10,
  defaultSortField = null,
  defaultSortOrder = 'asc',
  searchKeys = [], // e.g. ['name', 'email']
  customFilter = null // custom (item, lowercaseQuery) => boolean
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Reset page to 1 on query or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Request sorting
  const requestSort = (field) => {
    let order = 'asc';
    if (sortField === field && sortOrder === 'asc') {
      order = 'desc';
    }
    setSortField(field);
    setSortOrder(order);
  };

  // Resolve nested keys e.g. "category.name"
  const getNestedValue = (obj, path) => {
    if (!path) return '';
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Filter and Sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        if (customFilter) return customFilter(item, query);
        
        return searchKeys.some((key) => {
          const val = getNestedValue(item, key);
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // 2. Sorting
    if (sortField) {
      result.sort((a, b) => {
        let valA = getNestedValue(a, sortField);
        let valB = getNestedValue(b, sortField);

        // Normalize undefined/null
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        // Check if numerical sorting
        const numA = Number(valA);
        const numB = Number(valB);
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }

        // Default string comparison
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        
        if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
        if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, sortField, sortOrder, searchKeys, customFilter]);

  // Paginated chunk
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize) || 1;

  // Jump to page safely
  const jumpToPage = (page) => {
    const pageNum = Math.max(1, Math.min(totalPages, parseInt(page) || 1));
    setCurrentPage(pageNum);
  };

  return {
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    requestSort,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredData: filteredAndSortedData,
    paginatedData,
    jumpToPage,
    totalCount: data.length,
    filteredCount: filteredAndSortedData.length
  };
}
