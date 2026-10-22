import type { CrudFilter } from '@refinedev/core';
import { useEffect } from 'react';

export function useDebouncedFilters(
  setFilters: (filters: CrudFilter[], behavior?: 'replace' | 'merge') => void,
  filters: CrudFilter[],
) {
  const key = JSON.stringify(filters);

  useEffect(() => {
    const timeout = setTimeout(() => setFilters(JSON.parse(key) as CrudFilter[], 'replace'), 300);
    return () => clearTimeout(timeout);
  }, [key, setFilters]);
}
