import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOutboxStatus } from '@/api/outbox/useOutboxStatus';
import { formatRelativeTime } from '@/utils/time';

interface CachedDataNoticeProps {
  style?: StyleProp<ViewStyle>;
}

export const CachedDataNotice: React.FC<CachedDataNoticeProps> = ({ style }) => {
  const { isOffline } = useNetworkStatus();
  const { pendingCount, lastSyncedAt } = useOutboxStatus();
  const theme = useTheme();

  const lastSyncedRelative = formatRelativeTime(lastSyncedAt);

  if (!isOffline && pendingCount === 0) {
    return null;
  }

  const backgroundColor = theme.colors.secondaryContainer || '#E2E8F0';
  const textColor = theme.colors.onSecondaryContainer || theme.colors.primary;
  const icon = isOffline ? 'cloud-off-outline' : 'cloud-upload-outline';

  const message = isOffline ? 'Offline mode' : 'Syncing changes';
  const supporting = isOffline
    ? lastSyncedRelative
      ? `Showing cached data · Last synced ${lastSyncedRelative}`
      : 'Showing cached data'
    : `Processing ${pendingCount} queued update${pendingCount === 1 ? '' : 's'}`;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Icon source={icon} size={18} color={textColor} />
      <View style={styles.textContainer}>
        <Text variant="bodyMedium" style={[styles.title, { color: textColor }]}> 
          {message}
        </Text>
        <Text variant="bodySmall" style={[styles.subtitle, { color: textColor }]}>
          {supporting}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  textContainer: {
    flex: 1,
    gap: 2
  },
  title: {
    fontWeight: '600'
  },
  subtitle: {
    opacity: 0.85
  }
});
