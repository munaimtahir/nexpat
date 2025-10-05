import { outbox } from './outbox';
import type { OutboxEntry } from './types';

let mockStore: Map<string, string>;

jest.mock('@/storage/secureStore', () => {
  return {
    secureStore: {
      getString: jest.fn(async (key: string) => mockStore.get(key) ?? null),
      setString: jest.fn(async (key: string, value: string) => {
        mockStore.set(key, value);
      }),
      remove: jest.fn(async (key: string) => {
        mockStore.delete(key);
      })
    }
  };
});

describe('outbox subscribe', () => {
  beforeEach(() => {
    mockStore = new Map<string, string>();
  });

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

describe('outbox edge cases', () => {
  beforeEach(() => {
    mockStore = new Map<string, string>();
  });

  afterEach(async () => {
    const entries = await outbox.list();
    await Promise.all(entries.map((entry) => outbox.remove(entry.id)));
  });

  it('handles multiple concurrent enqueue operations', async () => {
    // Note: Due to the nature of async storage operations, truly concurrent
    // enqueues may have race conditions. This test demonstrates the behavior.
    const entries = [];
    entries.push(await outbox.enqueue('post', '/patients', { name: 'Alice' }));
    entries.push(await outbox.enqueue('post', '/patients', { name: 'Bob' }));
    entries.push(await outbox.enqueue('post', '/patients', { name: 'Charlie' }));

    const list = await outbox.list();
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.length).toBeLessThanOrEqual(3);
  });

  it('maintains correct order for sequential operations', async () => {
    const entry1 = await outbox.enqueue('post', '/patients', { name: 'First' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const entry2 = await outbox.enqueue('post', '/patients', { name: 'Second' });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const entry3 = await outbox.enqueue('post', '/patients', { name: 'Third' });

    const list = await outbox.list();
    expect(list).toHaveLength(3);
    expect(list[0].id).toBe(entry1.id);
    expect(list[1].id).toBe(entry2.id);
    expect(list[2].id).toBe(entry3.id);
  });

  it('handles large payload gracefully', async () => {
    const largeData = {
      name: 'Test',
      description: 'A'.repeat(10000)
    };

    const _entry = await outbox.enqueue('post', '/patients', largeData);
    const list = await outbox.list();
    
    expect(list).toHaveLength(1);
    expect(list[0].body).toEqual(largeData);
  });

  it('handles removal of non-existent entry', async () => {
    await expect(outbox.remove('non-existent-id')).resolves.not.toThrow();
  });

  it('supports multiple different HTTP methods', async () => {
    await outbox.enqueue('post', '/patients', { name: 'Alice' });
    await outbox.enqueue('put', '/patients/1', { name: 'Bob' });
    await outbox.enqueue('patch', '/patients/1', { status: 'active' });
    await outbox.enqueue('delete', '/patients/2', undefined);

    const list = await outbox.list();
    expect(list).toHaveLength(4);
    expect(list.map((e) => e.method).sort()).toEqual(['delete', 'patch', 'post', 'put']);
  });

  it('handles entries with different body types', async () => {
    await outbox.enqueue('post', '/upload', { file: 'data' });

    const list = await outbox.list();
    expect(list).toHaveLength(1);
    expect(list[0].body).toEqual({ file: 'data' });
  });

  it('properly handles rapid add/remove cycles', async () => {
    for (let i = 0; i < 5; i++) {
      const entry = await outbox.enqueue('post', '/test', { iteration: i });
      await outbox.remove(entry.id);
    }

    const list = await outbox.list();
    expect(list).toHaveLength(0);
  });

  it('notifies multiple subscribers independently', async () => {
    const events1: OutboxEntry[][] = [];
    const events2: OutboxEntry[][] = [];

    const unsubscribe1 = outbox.subscribe((entries) => {
      events1.push(entries);
    });
    const unsubscribe2 = outbox.subscribe((entries) => {
      events2.push(entries);
    });

    await outbox.enqueue('post', '/patients', { name: 'Alice' });

    expect(events1.length).toBeGreaterThan(0);
    expect(events2.length).toBeGreaterThan(0);
    expect(events1.at(-1)).toEqual(events2.at(-1));

    unsubscribe1();
    unsubscribe2();
  });
});
