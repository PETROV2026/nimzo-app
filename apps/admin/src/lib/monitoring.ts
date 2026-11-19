import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: import.meta.env.DEV ? 'development' : 'production',
  release: `nimzo-admin@${__APP_COMMIT__}`,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
  tracePropagationTargets: [],
});

export function setMonitoringUser(userId: string | null) {
  Sentry.setUser(userId ? { id: userId } : null);
}

export const reactErrorHandler = Sentry.reactErrorHandler;
