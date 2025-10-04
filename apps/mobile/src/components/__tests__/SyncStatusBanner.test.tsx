import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SyncStatusBanner } from '@/components/SyncStatusBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOutboxStatus } from '@/api/outbox/useOutboxStatus';
import type { OutboxEntry } from '@/api/outbox/types';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock('react-native-paper', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Banner: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Text: ({ children, ...props }: React.ComponentProps<typeof RNText>) => <RNText {...props}>{children}</RNText>,
    useTheme: () => ({
      colors: {
        errorContainer: '#fee',
        onErrorContainer: '#900',
        primaryContainer: '#eef',
        onPrimaryContainer: '#006'
      }
    }),
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
});

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn()
}));

jest.mock('@/api/outbox/useOutboxStatus', () => ({
  useOutboxStatus: jest.fn()
}));

const mockedUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
const mockedUseOutboxStatus = useOutboxStatus as jest.MockedFunction<typeof useOutboxStatus>;

const buildOutboxStatus = (
  overrides: Partial<ReturnType<typeof useOutboxStatus>> = {}
): ReturnType<typeof useOutboxStatus> => {
  const entries = overrides.entries ?? [];
  const pendingCount = overrides.pendingCount ?? entries.length;
  return {
    ...overrides,
    entries,
    pendingCount,
    hasPending: overrides.hasPending ?? pendingCount > 0,
    lastQueuedAt: overrides.lastQueuedAt,
    lastSyncedAt: overrides.lastSyncedAt
  };
};

describe('SyncStatusBanner', () => {
  const renderBanner = () => render(<SyncStatusBanner />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNetworkStatus.mockReturnValue({ isOffline: false });
    mockedUseOutboxStatus.mockReturnValue(buildOutboxStatus());
  });

  it('shows offline cached message when offline with queue', async () => {
    mockedUseNetworkStatus.mockReturnValue({ isOffline: true });
    const queuedEntries: OutboxEntry[] = [
      { id: '1', method: 'post', url: '/uploads', createdAt: '2024-01-01T09:59:59Z' },
      { id: '2', method: 'post', url: '/uploads', createdAt: '2024-01-01T10:00:00Z' }
    ];
    mockedUseOutboxStatus.mockReturnValue(
      buildOutboxStatus({
        entries: queuedEntries,
        pendingCount: queuedEntries.length,
        hasPending: true,
        lastQueuedAt: new Date('2024-01-01T10:00:00Z').toISOString()
      })
    );

    const { getByTestId } = renderBanner();

    expect(mockedUseNetworkStatus).toHaveBeenCalled();
    expect(mockedUseOutboxStatus).toHaveBeenCalled();
    await waitFor(() => {
      expect(getByTestId('sync-status-message').props.children).toContain('Offline mode');
      expect(getByTestId('sync-status-message').props.children).toContain('2 updates queued');
      expect(getByTestId('sync-status-supporting').props.children).toContain('Last update queued');
    });
  });

  it('shows sync message when back online', async () => {
    mockedUseNetworkStatus.mockReturnValue({ isOffline: false });
    const replayEntries: OutboxEntry[] = [
      { id: '3', method: 'post', url: '/uploads', createdAt: '2024-01-01T12:00:00Z' }
    ];
    mockedUseOutboxStatus.mockReturnValue(
      buildOutboxStatus({
        entries: replayEntries,
        pendingCount: replayEntries.length,
        hasPending: true,
        lastQueuedAt: new Date('2024-01-01T12:00:00Z').toISOString()
      })
    );

    const { getByTestId } = renderBanner();

    await waitFor(() => {
      expect(getByTestId('sync-status-message').props.children).toContain('Back online');
      expect(getByTestId('sync-status-message').props.children).toContain('1 update queued');
      expect(getByTestId('sync-status-supporting').props.children).toContain('Last update queued');
    });
  });
});
