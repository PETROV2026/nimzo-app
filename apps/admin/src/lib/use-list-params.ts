import { useCallback, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';

import { rememberListQuery } from './list-path';

const WRITE_DELAY_MS = 300;
const uuidPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const noKeys: readonly string[] = [];

function isDate(value: string) {
  if (!datePattern.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function useListParam(
  key: string,
  clears: readonly string[] = noKeys,
): [string, (value: string) => void] {
  const { pathname, search } = useLocation();
  const [params, setParams] = useSearchParams();

  useEffect(() => rememberListQuery(pathname, search), [pathname, search]);

  const setParam = useCallback(
    (value: string) =>
      setParams(
        () => {
          const next = new URLSearchParams(window.location.search);
          if (value) next.set(key, value);
          else next.delete(key);
          for (const other of clears) next.delete(other);
          return next;
        },
        { replace: true },
      ),
    [key, clears, setParams],
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

export function useIdParam(
  key: string,
  clears?: readonly string[],
): [string | undefined, (id: string | undefined) => void] {
  const [value, setParam] = useListParam(key, clears);
  const setId = useCallback((id: string | undefined) => setParam(id ?? ''), [setParam]);
  return [uuidPattern.test(value) ? value : undefined, setId];
}

function useDraftParam(key: string): [string, (value: string) => void] {
  const [current, setParam] = useListParam(key);
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

export function useSearchParam(): [string, (value: string) => void] {
  return useDraftParam('q');
}

export function useDigitsParam(key: string, maxLength: number): [string, (value: string) => void] {
  const [draft, setDraft] = useDraftParam(key);
  const setDigits = useCallback(
    (value: string) => setDraft(value.replace(/\D/g, '').slice(0, maxLength)),
    [maxLength, setDraft],
  );
  return [draft.replace(/\D/g, '').slice(0, maxLength), setDigits];
}

export function useDateParam(key: string): [string, (value: string) => void] {
  const [draft, setDraft] = useDraftParam(key);
  return [isDate(draft) ? draft : '', setDraft];
}
