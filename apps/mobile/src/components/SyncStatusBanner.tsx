import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner, Button, Dialog, List, Portal, Text, useTheme } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOutboxStatus } from '@/api/outbox/useOutboxStatus';
import { formatRelativeTime } from '@/utils/time';

export const SyncStatusBanner: React.FC = () => {
  const { isOffline } = useNetworkStatus();
  const { entries, pendingCount, lastQueuedAt, lastSyncedAt } = useOutboxStatus();
  const show = isOffline || pendingCount > 0;
  const [visible, setVisible] = React.useState(show);
  const [detailsVisible, setDetailsVisible] = React.useState(false);
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    setVisible(show);
  }, [show]);

  React.useEffect(() => {
    if (show) {
      translateY.value = withSpring(0, { damping: 12, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 220 });
    } else {
      translateY.value = withTiming(-120, { duration: 220 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [opacity, show, translateY]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value
  }));

  if (!show) {
    return null;
  }

  const queuedDescriptor = pendingCount > 0 ? `${pendingCount} update${pendingCount === 1 ? '' : 's'} queued` : undefined;
  const statusDescriptor = isOffline ? 'Offline mode · showing cached data' : pendingCount > 0 ? 'Syncing changes' : 'Back online';
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
        <Animated.View style={[styles.animated, containerStyle]}>
          <Banner
          visible={visible}
          style={[styles.banner, { backgroundColor }]}
          icon={icon}
          actions={pendingCount > 0 ? [{ label: 'View queue', onPress: () => setDetailsVisible(true) }] : []}
        >
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
        </Animated.View>
      </View>
      <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)}>
        <Dialog.Title>Queued updates</Dialog.Title>
        <Dialog.Content>
          {entries.length === 0 ? (
            <Text>All updates have been synced.</Text>
          ) : (
            <List.Section>
              {entries.map((entry) => (
                <List.Item
                  key={entry.id}
                  title={`${entry.method.toUpperCase()} ${entry.url}`}
                  description={formatRelativeTime(entry.createdAt) ? `Queued ${formatRelativeTime(entry.createdAt)}` : 'Queued moments ago'}
                  left={(props) => <List.Icon {...props} icon="clock-outline" />}
                />
              ))}
            </List.Section>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setDetailsVisible(false)}>Close</Button>
        </Dialog.Actions>
      </Dialog>
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
  animated: {
    paddingHorizontal: 16
  },
  banner: {
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
