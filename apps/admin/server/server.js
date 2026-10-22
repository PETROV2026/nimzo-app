const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.join(__dirname, 'public');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const basePath = config.basePath.replace(/\/+$/, '');
const indexFile = path.join(root, 'index.html');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const compressible = new Set(['.html', '.js', '.css', '.json', '.svg']);

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '),
};

const gzipCache = new Map();

function relativePath(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  } catch {
    return null;
  }
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    pathname = pathname.slice(basePath.length) || '/';
  }
  return pathname;
}

function resolveFile(pathname) {
  const file = path.join(root, pathname);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) return null;
  try {
    return fs.statSync(file).isFile() ? file : null;
  } catch {
    return null;
  }
}

function send(req, res, file, status) {
  const extension = path.extname(file);
  const stat = fs.statSync(file);
  const headers = {
    ...securityHeaders,
    'Content-Type': types[extension] ?? 'application/octet-stream',
    'Cache-Control': file.includes(`${path.sep}assets${path.sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
    'Last-Modified': stat.mtime.toUTCString(),
    Vary: 'Accept-Encoding',
  };
  let body = fs.readFileSync(file);
  if (compressible.has(extension) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    const key = `${file}:${stat.mtimeMs}`;
    if (!gzipCache.has(key)) gzipCache.set(key, zlib.gzipSync(body));
    body = gzipCache.get(key);
    headers['Content-Encoding'] = 'gzip';
  }
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}

function notFound(res) {
  res.writeHead(404, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('No encontrado');
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }
  const pathname = relativePath(req.url ?? '/');
  if (pathname === null) {
    notFound(res);
    return;
  }
  const file = resolveFile(pathname);
  if (file) {
    send(req, res, file, 200);
    return;
  }
  if (pathname.startsWith('/assets/') || path.extname(pathname)) {
    notFound(res);
    return;
  }
  send(req, res, indexFile, 200);
});

server.listen(process.env.PORT || 3000);
