import Constants from 'expo-constants';

type Extra = {
  serverUrl?: string;
  sentryDsn?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  serverUrl: extra.serverUrl ?? 'http://localhost:8000',
  sentryDsn: extra.sentryDsn ?? ''
};
