import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';

import { rememberListQuery } from './list-path';

const WRITE_DELAY_MS = 300;
const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function useListParam(key: string): [string, (value: string) => void] {
  const { pathname, search } = useLocation();
  const [params, setParams] = useSearchParams();

  useEffect(() => rememberListQuery(pathname, search), [pathname, search]);

  const setParam = useCallback(
    (value: string) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [key, setParams],
  );

  return [params.get(key) ?? '', setParam];
}

export function useOptionParam<T extends string>(
  key: string,
  options: readonly T[],
  fallback: T,
): [T, (value: T) => void] {
  const [value, setParam] = useListParam(key);
  const setOption = useCallback(
    (option: T) => setParam(option === fallback ? '' : option),
    [fallback, setParam],
  );
  return [options.find((option) => option === value) ?? fallback, setOption];
}

export function useIdParam(key: string): [string | undefined, (id: string | undefined) => void] {
  const [value, setParam] = useListParam(key);
  const setId = useCallback((id: string | undefined) => setParam(id ?? ''), [setParam]);
  return [uuidPattern.test(value) ? value : undefined, setId];
}

export function useSearchParam(): [string, (value: string) => void] {
  const [current, setParam] = useListParam('q');
  const [draft, setDraft] = useState(current);
  const [seen, setSeen] = useState(current);
  const [written, setWritten] = useState(current);

  if (current !== seen) {
    setSeen(current);
    if (current !== written) {
      setDraft(current);
      setWritten(current);
    }
  }

  const term = draft.trim();
  useEffect(() => {
    if (term === seen) return;
    const timeout = setTimeout(() => {
      setWritten(term);
      setParam(term);
    }, WRITE_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [term, seen, setParam]);

  return [draft, setDraft];
}
