type CatalogVersion = { code: string; updated_at: string };

export const foregroundIntervalMs = 10 * 60_000;

function fingerprint(forms: readonly CatalogVersion[]) {
  return forms
    .map((form) => `${form.code}@${form.updated_at}`)
    .sort()
    .join('|');
}

export function shouldReplaceCatalog(
  saved: readonly CatalogVersion[],
  downloaded: readonly CatalogVersion[],
) {
  if (downloaded.length === 0) return false;
  return fingerprint(saved) !== fingerprint(downloaded);
}

export function isDownloadDue(
  lastDownloadAt: number | null,
  now: number,
  { force }: { force: boolean },
) {
  return force || lastDownloadAt === null || now - lastDownloadAt >= foregroundIntervalMs;
}

export function isServerError(error: unknown): error is { code: string; message: string } {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  return typeof error.code === 'string' && /^(PGRST\d+|[0-9A-Z]{5})$/.test(error.code);
}
