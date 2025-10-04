import React from 'react';
import { render } from '@testing-library/react-native';
import { CachedDataNotice } from '@/components/CachedDataNotice';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOutboxStatus } from '@/api/outbox/useOutboxStatus';

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn()
}));

jest.mock('@/api/outbox/useOutboxStatus', () => ({
  useOutboxStatus: jest.fn()
}));

jest.mock('react-native-paper', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Icon: () => null,
    Text: ({ children, ...props }: React.ComponentProps<typeof RNText>) => <RNText {...props}>{children}</RNText>,
    useTheme: () => ({
      colors: {
        secondaryContainer: '#eee',
        onSecondaryContainer: '#111'
      }
    })
  };
});

const mockedUseNetworkStatus = useNetworkStatus as jest.MockedFunction<typeof useNetworkStatus>;
const mockedUseOutboxStatus = useOutboxStatus as jest.MockedFunction<typeof useOutboxStatus>;

describe('CachedDataNotice', () => {
  beforeEach(() => {
    mockedUseNetworkStatus.mockReturnValue({ isOffline: false });
    mockedUseOutboxStatus.mockReturnValue({
      entries: [],
      pendingCount: 0,
      hasPending: false,
      lastQueuedAt: undefined,
      lastSyncedAt: undefined
    });
  });

  it('renders offline message when offline', () => {
    mockedUseNetworkStatus.mockReturnValue({ isOffline: true });
    mockedUseOutboxStatus.mockReturnValue({
      entries: [],
      pendingCount: 0,
      hasPending: false,
      lastQueuedAt: undefined,
      lastSyncedAt: new Date('2024-01-01T10:00:00Z').toISOString()
    });

    const { getByText } = render(<CachedDataNotice />);

    expect(getByText('Offline mode')).toBeTruthy();
    expect(getByText(/Showing cached data/)).toBeTruthy();
  });

  it('renders syncing message when pending', () => {
    mockedUseNetworkStatus.mockReturnValue({ isOffline: false });
    mockedUseOutboxStatus.mockReturnValue({
      entries: [],
      pendingCount: 2,
      hasPending: true,
      lastQueuedAt: undefined,
      lastSyncedAt: undefined
    });

    const { getByText } = render(<CachedDataNotice />);

    expect(getByText('Syncing changes')).toBeTruthy();
    expect(getByText(/Processing 2 queued updates/)).toBeTruthy();
  });
});
