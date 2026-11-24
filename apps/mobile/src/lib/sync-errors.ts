export class SyncTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Sync request timed out after ${timeoutMs} ms`);
    this.name = 'SyncTimeoutError';
  }
}

export function isServerError(error: unknown): error is { code: string; message: string } {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  return typeof error.code === 'string' && /^(PGRST\d+|[0-9A-Z]{5})$/.test(error.code);
}

export function syncErrorToReport(error: unknown, label: string): Error | null {
  if (error instanceof SyncTimeoutError) return null;
  if (error instanceof Error) return error;
  if (isServerError(error)) return new Error(`${label} failed: ${error.code} ${error.message}`);
  return null;
}
