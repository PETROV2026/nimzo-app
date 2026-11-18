export const defaultAllowedOrigins = ['https://nimzo-app-web.vercel.app', 'http://localhost:5173'];

export type CorsOptions = { allowedOrigins?: string[] };

export function parseAllowedOrigins(value: string | undefined): string[] {
  const origins = (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : defaultAllowedOrigins;
}

const baseHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

export function createCors({ allowedOrigins = defaultAllowedOrigins }: CorsOptions = {}) {
  return {
    rejects(request: Request) {
      const origin = request.headers.get('origin');
      return origin !== null && !allowedOrigins.includes(origin);
    },
    headersFor(request: Request): Record<string, string> {
      const origin = request.headers.get('origin');
      return origin !== null && allowedOrigins.includes(origin)
        ? { ...baseHeaders, 'Access-Control-Allow-Origin': origin }
        : baseHeaders;
    },
  };
}
