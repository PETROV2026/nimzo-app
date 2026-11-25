import type { CrudFilter } from '@refinedev/core';
import { useEffect, useRef } from 'react';

const APPLY_DELAY_MS = 300;

type ListTable = {
  setFilters: (filters: CrudFilter[], behavior?: 'replace' | 'merge') => void;
  setCurrentPage: (page: number) => void;
};

export function useDebouncedFilters(
  { setFilters, setCurrentPage }: ListTable,
  filters: CrudFilter[],
) {
  const key = JSON.stringify(filters);
  const applied = useRef('[]');
  const mounted = useRef(false);

  useEffect(() => {
    const apply = () => {
      applied.current = key;
      setFilters(JSON.parse(key) as CrudFilter[], 'replace');
      setCurrentPage(1);
    };
    const immediate = !mounted.current;
    mounted.current = true;
    if (key === applied.current) return;
    if (immediate) {
      apply();
      return;
    }
    const timeout = setTimeout(apply, APPLY_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [key, setFilters, setCurrentPage]);
}
