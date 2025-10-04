import { STORAGE_KEYS } from '@/constants';
import { secureStore } from '@/storage/secureStore';
import type { OutboxEntry, OutboxMethod, SerializedFormData } from './types';
import { isFormDataLike } from './types';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const serializeBody = (body: unknown): unknown | SerializedFormData => {
  if (!body) return body;
  if (isFormDataLike(body)) {
    return {
      __type: 'FormData',
      parts: body._parts.map(([key, value]) => [key, value])
    } as SerializedFormData;
  }
  return body;
};

type Listener = (entries: OutboxEntry[]) => void;

const listeners = new Set<Listener>();

const notify = (entries: OutboxEntry[]) => {
  listeners.forEach((listener) => {
    try {
      listener(entries);
    } catch (error) {
      // swallow listener errors to avoid breaking outbox operations
    }
  });
};

const getEntries = async (): Promise<OutboxEntry[]> => {
  const raw = await secureStore.getString(STORAGE_KEYS.outbox);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OutboxEntry[];
  } catch (error) {
    return [];
  }
};

const saveEntries = async (entries: OutboxEntry[]) => {
  await secureStore.setString(STORAGE_KEYS.outbox, JSON.stringify(entries));
  notify(entries);
};

export const outbox = {
  async enqueue(method: OutboxMethod, url: string, body?: unknown, headers?: Record<string, string>) {
    const entries = await getEntries();
    const entry: OutboxEntry = {
      id: generateId(),
      method,
      url,
      body: serializeBody(body),
      headers,
      createdAt: new Date().toISOString(),
      attempt: 0
    };
    entries.push(entry);
    await saveEntries(entries);
    return entry;
  },
  async remove(id: string) {
    const entries = await getEntries();
    const next = entries.filter((entry) => entry.id !== id);
    await saveEntries(next);
  },
  async clear() {
    await saveEntries([]);
  },
  async list() {
    return getEntries();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};
