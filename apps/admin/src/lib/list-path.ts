const lastQuery = new Map<string, string>();

export function rememberListQuery(path: string, query: string) {
  lastQuery.set(path, query);
}

export function listPath(path: string) {
  return `${path}${lastQuery.get(path) ?? ''}`;
}
