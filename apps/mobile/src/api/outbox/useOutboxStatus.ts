import { useEffect, useMemo, useRef, useState } from 'react';
import { outbox } from './outbox';
import type { OutboxEntry } from './types';

interface OutboxStatus {
  entries: OutboxEntry[];
  pendingCount: number;
  hasPending: boolean;
  lastQueuedAt?: string;
  lastSyncedAt?: string;
}

export const useOutboxStatus = (): OutboxStatus => {
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const load = async () => {
      const initialEntries = await outbox.list();
      if (mountedRef.current) {
        setEntries(initialEntries);
        if (initialEntries.length === 0) {
          setLastSyncedAt(new Date().toISOString());
        }
      }
    };

    load();

    const unsubscribe = outbox.subscribe((nextEntries) => {
      if (!mountedRef.current) return;
      setEntries(nextEntries);
      if (nextEntries.length === 0) {
        setLastSyncedAt(new Date().toISOString());
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const lastQueuedAt = useMemo(() => {
    if (entries.length === 0) {
      return undefined;
    }

    return entries.reduce((latest, entry) => {
      if (!latest) {
        return entry.createdAt;
      }
      return new Date(entry.createdAt).getTime() > new Date(latest).getTime() ? entry.createdAt : latest;
    }, undefined as string | undefined);
  }, [entries]);

  return {
    entries,
    pendingCount: entries.length,
    hasPending: entries.length > 0,
    lastQueuedAt,
    lastSyncedAt
  };
};
