import axios from 'axios';
import { env } from '@/utils/environment';
import { logger } from '@/utils/logger';
import { outbox } from './outbox';
import type { OutboxEntry } from './types';
import { secureStore } from '@/storage/secureStore';
import { STORAGE_KEYS } from '@/constants';

const client = axios.create({ baseURL: env.serverUrl });

client.interceptors.request.use(async (config) => {
  const token = await secureStore.getString(STORAGE_KEYS.token);
  if (token) {
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`
    };
  }
  return config;
});

const deserializeBody = (body: unknown) => {
  if (body && typeof body === 'object' && (body as any).__type === 'FormData') {
    const form = new FormData();
    for (const [key, value] of (body as any).parts as [string, any][]) {
      form.append(key, value);
    }
    return form;
  }
  return body;
};

const executeEntry = async (entry: OutboxEntry) => {
  const { method, url, body, headers } = entry;
  await client.request({ method, url, data: deserializeBody(body), headers });
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
