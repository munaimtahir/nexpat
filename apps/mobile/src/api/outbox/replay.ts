import axios, { AxiosHeaders, type AxiosRequestHeaders } from 'axios';
import { env } from '@/utils/environment';
import { logger } from '@/utils/logger';
import { outbox } from './outbox';
import type { OutboxEntry } from './types';
import { isSerializedFormData } from './types';
import { secureStore } from '@/storage/secureStore';
import { STORAGE_KEYS } from '@/constants';

const client = axios.create({ baseURL: env.serverUrl });

client.interceptors.request.use(async (config) => {
  const token = await secureStore.getString(STORAGE_KEYS.token);
  if (token) {
    const headers = AxiosHeaders.from((config.headers ?? {}) as AxiosRequestHeaders);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

const deserializeBody = (body: unknown) => {
  if (isSerializedFormData(body)) {
    const form = new FormData();
    for (const [key, value] of body.parts) {
      form.append(key, value);
    }
    return form;
  }
  return body;
};

const executeEntry = async (entry: OutboxEntry) => {
  const { method, url, body, headers } = entry;
  const requestHeaders = headers ? AxiosHeaders.from(headers as AxiosRequestHeaders) : undefined;
  await client.request({ method, url, data: deserializeBody(body), headers: requestHeaders });
};

export const replayOutbox = async () => {
  const entries = await outbox.list();
  for (const entry of entries) {
    try {
      await executeEntry(entry);
      await outbox.remove(entry.id);
      logger.info('Outbox entry replayed', entry);
    } catch (error) {
      logger.error('Failed to replay outbox entry', { entry, error });
      break;
    }
  }
};

if (require.main === module) {
  replayOutbox().catch((error) => {
    logger.error('Outbox replay failure', error);
    process.exit(1);
  });
}
