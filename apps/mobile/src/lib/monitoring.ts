import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: __DEV__ ? 'development' : 'production',
  sendDefaultPii: false,
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  enableLogs: true,
  integrations: [
    Sentry.expoRouterIntegration({
      enableTimeToInitialDisplay: !isRunningInExpoGo(),
    }),
  ],
  enableNativeFramesTracking: !isRunningInExpoGo(),
});

export function setMonitoringUser(userId: string | null) {
  Sentry.setUser(userId ? { id: userId } : null);
}

export function reportError(error: unknown) {
  Sentry.captureException(error);
}

export const wrapRoot = Sentry.wrap;
