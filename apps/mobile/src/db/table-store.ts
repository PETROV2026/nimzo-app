export function createTableStore<T>(load: (technicianId: string) => T[]) {
  const listeners = new Set<() => void>();
  let version = 0;
  let cache: { technicianId: string; version: number; rows: T[] } | null = null;

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      version += 1;
      for (const listener of listeners) listener();
    },
    snapshot(technicianId: string) {
      if (!cache || cache.technicianId !== technicianId || cache.version !== version) {
        cache = { technicianId, version, rows: load(technicianId) };
      }
      return cache.rows;
    },
  };
}
