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
