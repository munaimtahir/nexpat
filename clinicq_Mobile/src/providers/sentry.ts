import * as Sentry from '@sentry/react-native';
import { env } from '@/utils/environment';

let initialized = false;

export const initSentry = () => {
  if (initialized || !env.sentryDsn) {
    initialized = true;
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    tracesSampleRate: 0.1
  });

  initialized = true;
};
