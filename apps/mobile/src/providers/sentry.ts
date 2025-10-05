import * as Sentry from '@sentry/react-native';
import { env } from '@/utils/environment';
import Constants from 'expo-constants';

let initialized = false;

export const initSentry = () => {
  if (initialized || !env.sentryDsn) {
    initialized = true;
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    tracesSampleRate: 0.1,
    // Add environment configuration
    environment: __DEV__ ? 'development' : 'production',
    // Add release information for better tracking
    release: Constants.expoConfig?.version ?? '0.1.0',
    dist: Constants.expoConfig?.android?.versionCode?.toString() ?? '1',
    // Enable native crash reporting
    enableNative: true,
    // Enable automatic session tracking
    enableAutoSessionTracking: true,
    // Set session tracking interval
    sessionTrackingIntervalMillis: 30000,
    // Attach stack traces to all messages
    attachStacktrace: true,
    // Enable offline storage
    maxBreadcrumbs: 100,
    // Disable in development by default
    enabled: !__DEV__
  });

  initialized = true;
};

// Export Sentry for error boundary usage
export { Sentry };
