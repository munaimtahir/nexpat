import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner, Portal, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOutboxStatus } from '@/api/outbox/useOutboxStatus';

const formatRelativeTime = (isoDate?: string) => {
  if (!isoDate) {
    return undefined;
  }

  try {
    return formatDistanceToNow(new Date(isoDate), { addSuffix: true });
  } catch (error) {
    return undefined;
  }
};

export const SyncStatusBanner: React.FC = () => {
  const { isOffline } = useNetworkStatus();
  const { pendingCount, lastQueuedAt, lastSyncedAt } = useOutboxStatus();
  const show = isOffline || pendingCount > 0;
  const [visible, setVisible] = React.useState(show);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  React.useEffect(() => {
    setVisible(show);
  }, [show]);

  if (!show) {
    return null;
  }

  const queuedDescriptor = pendingCount > 0 ? `${pendingCount} update${pendingCount === 1 ? '' : 's'} queued` : undefined;
  const statusDescriptor = isOffline ? 'Offline mode · showing cached data' : 'Back online';
  const lastQueuedRelative = formatRelativeTime(lastQueuedAt);
  const lastSyncedRelative = !isOffline && pendingCount === 0 ? formatRelativeTime(lastSyncedAt) : undefined;

  const message = [statusDescriptor, queuedDescriptor].filter(Boolean).join(' · ');

  const supportingText = lastQueuedRelative
    ? `Last update queued ${lastQueuedRelative}`
    : lastSyncedRelative
      ? `Last sync ${lastSyncedRelative}`
      : undefined;

  const backgroundColor = isOffline
    ? theme.colors.errorContainer || '#FFE5E7'
    : theme.colors.primaryContainer || '#E3F2FD';

  const textColor = isOffline
    ? theme.colors.onErrorContainer || theme.colors.error
    : theme.colors.onPrimaryContainer || theme.colors.primary;

  const icon = isOffline ? 'cloud-off-outline' : pendingCount > 0 ? 'cloud-upload-outline' : 'cloud-check-outline';

  return (
    <Portal>
      <View pointerEvents="box-none" style={[styles.wrapper, { paddingTop: insets.top + 8 }]}> 
        <Banner visible={visible} style={[styles.banner, { backgroundColor }]} icon={icon}>
          <View style={styles.content}> 
            <Text testID="sync-status-message" variant="titleSmall" style={[styles.message, { color: textColor }]}>
              {message}
            </Text>
            {supportingText ? (
              <Text
                testID="sync-status-supporting"
                variant="bodySmall"
                style={[styles.supporting, { color: textColor }]}
              >
                {supportingText}
              </Text>
            ) : null}
          </View>
        </Banner>
      </View>
    </Portal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10
  },
  banner: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2
  },
  content: {
    gap: 4
  },
  message: {
    fontWeight: '600'
  },
  supporting: {
    opacity: 0.85
  }
});
