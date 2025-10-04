import React from 'react';
import { render } from '@testing-library/react-native';
import { SyncStatusBanner } from '@/components/SyncStatusBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOutboxStatus } from '@/api/outbox/useOutboxStatus';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));

jest.mock('react-native-paper', () => {
  const React = require('react');
  const { Text: RNText } = require('react-native');
  return {
    Banner: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Text: ({ children, ...props }: { children: React.ReactNode }) => <RNText {...props}>{children}</RNText>,
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

describe('SyncStatusBanner', () => {
  const renderBanner = () => render(<SyncStatusBanner />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNetworkStatus.mockReturnValue({ isOffline: false });
    mockedUseOutboxStatus.mockReturnValue({ pendingCount: 0, lastQueuedAt: undefined, lastSyncedAt: undefined });
  });

  it('shows offline cached message when offline with queue', async () => {
    mockedUseNetworkStatus.mockReturnValue({ isOffline: true });
    mockedUseOutboxStatus.mockReturnValue({
      pendingCount: 2,
      lastQueuedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
      lastSyncedAt: undefined
    });

    const { getByText } = renderBanner();

    expect(mockedUseNetworkStatus).toHaveBeenCalled();
    expect(mockedUseOutboxStatus).toHaveBeenCalled();
    expect(getByText(/Offline mode/i)).toBeTruthy();
    expect(getByText(/2 updates queued/i)).toBeTruthy();
  });

  it('shows sync message when back online', async () => {
    mockedUseNetworkStatus.mockReturnValue({ isOffline: false });
    mockedUseOutboxStatus.mockReturnValue({
      pendingCount: 1,
      lastQueuedAt: new Date('2024-01-01T12:00:00Z').toISOString(),
      lastSyncedAt: undefined
    });

    const { getByText } = renderBanner();

    expect(getByText(/Back online/)).toBeTruthy();
    expect(getByText(/Last update queued/i)).toBeTruthy();
  });
});
