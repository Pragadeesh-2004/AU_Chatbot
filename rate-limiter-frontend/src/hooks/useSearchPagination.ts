import { useMemo } from 'react';

export function useSearchPagination<T>(
  data: T[], 
  search: string, 
  page: number, 
  pageSize: number, 
  searchKeys: (keyof T)[]
) {
  return useMemo(() => {
    const filtered = data.filter(item =>
      searchKeys.some(key => 
        String(item[key]).toLowerCase().includes(search.trim().toLowerCase())
      )
    );
    
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const validPage = Math.min(page, totalPages);
    const paginated = filtered.slice((validPage - 1) * pageSize, validPage * pageSize);
    
    return { 
      filtered, 
      paginated, 
      totalPages, 
      currentPage: validPage 
    };
  }, [data, search, page, pageSize, searchKeys]);
}