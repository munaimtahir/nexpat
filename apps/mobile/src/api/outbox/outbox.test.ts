import { outbox } from './outbox';
import type { OutboxEntry } from './types';

jest.mock('@/storage/secureStore', () => {
  const store = new Map<string, string>();
  return {
    secureStore: {
      getString: jest.fn(async (key: string) => store.get(key) ?? null),
      setString: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      remove: jest.fn(async (key: string) => {
        store.delete(key);
      })
    }
  };
});

describe('outbox subscribe', () => {
  afterEach(async () => {
    const entries = await outbox.list();
    await Promise.all(entries.map((entry) => outbox.remove(entry.id)));
  });

  it('notifies listeners when entries change', async () => {
    const events: OutboxEntry[][] = [];
    const unsubscribe = outbox.subscribe((entries) => {
      events.push(entries);
    });

    const created = await outbox.enqueue('post', '/patients', { name: 'Alice' });

    expect(events.at(-1)).toEqual([created]);

    await outbox.remove(created.id);

    expect(events.at(-1)).toEqual([]);

    unsubscribe();
  });
});
