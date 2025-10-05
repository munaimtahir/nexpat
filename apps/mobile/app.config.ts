import 'dotenv/config';
import type { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: 'ClinicQ Mobile',
  slug: 'clinicq-mobile',
  version: '0.1.0',
  scheme: 'clinicq',
  owner: process.env.EXPO_OWNER ?? 'munaim',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.clinicq.mobile'
  },
  android: {
    package: 'com.clinicq.mobile'
  },
  web: {
    bundler: 'metro',
    output: 'static'
  },
  extra: {
    serverUrl: process.env.SERVER_URL,
    sentryDsn: process.env.SENTRY_DSN
  },
  plugins: ['sentry-expo']
};

export default config;
