import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useKeepAwake } from 'expo-keep-awake';
import { setStatusBarHidden } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';
import { usePublicDisplayQueue } from '@/api/hooks/usePublicDisplayQueue';
import type { PublicDisplayEntry } from '@/api/hooks/usePublicDisplayQueue';

const formatName = (entry: PublicDisplayEntry) => {
  const patient = entry.patient;
  if (patient) {
    return patient.name;
  }
  return `Patient #${entry.visit.patient}`;
};

const formatStatus = (status: string) =>
  status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export const PublicDisplayScreen: React.FC = () => {
  useKeepAwake();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queueQuery = usePublicDisplayQueue();
  const [isOffline, setIsOffline] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarHidden(true, 'fade');
      const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
      });

      NetInfo.fetch().then((state) => {
        setIsOffline(!(state.isConnected && state.isInternetReachable !== false));
      });

      return () => {
        setStatusBarHidden(false, 'fade');
        unsubscribeNetInfo();
      };
    }, [])
  );

  const entries = queueQuery.data ?? [];
  const nowServing =
    entries.find((entry) => entry.visit.status === 'IN_ROOM') ??
    entries.find((entry) => entry.visit.status === 'START') ??
    entries[0];
  const waiting = nowServing
    ? entries.filter((entry) => entry.visit.id !== nowServing.visit.id)
    : entries;

  const lastUpdated = queueQuery.dataUpdatedAt ? new Date(queueQuery.dataUpdatedAt).toLocaleTimeString() : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Clinic Queue</Text>
          <View style={styles.headerRight}>
            {isOffline ? <Text style={styles.offline}>Offline mode</Text> : null}
            <Text style={styles.timestamp}>{lastUpdated ? `Updated ${lastUpdated}` : 'Fetching…'}</Text>
          </View>
        </View>

        {queueQuery.isLoading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading queue…</Text>
          </View>
        ) : queueQuery.isError ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>Unable to load queue data</Text>
            <Button mode="outlined" onPress={() => queueQuery.refetch()} style={styles.retryButton}>
              Try again
            </Button>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>No patients are currently waiting</Text>
          </View>
        ) : (
          <>
            {nowServing ? (
              <View style={styles.nowServingCard}>
                <Text style={styles.nowServingLabel}>Now serving</Text>
                <Text style={styles.nowServingName}>{formatName(nowServing)}</Text>
                <Text style={styles.nowServingMeta}>Visit #{nowServing.visit.id}</Text>
              </View>
            ) : null}

            <View style={styles.waitingHeader}>
              <Text style={styles.waitingTitle}>Up next</Text>
              <Button mode="text" onPress={() => queueQuery.refetch()} loading={queueQuery.isFetching}>
                Refresh
              </Button>
            </View>
            <FlatList
              data={waiting}
              keyExtractor={(item) => String(item.visit.id)}
              contentContainerStyle={waiting.length === 0 ? styles.emptyList : undefined}
              renderItem={({ item, index }) => (
                <View style={styles.waitingRow}>
                  <Text style={styles.waitingPosition}>{index + 1}</Text>
                  <View style={styles.waitingInfo}>
                    <Text style={styles.waitingName}>{formatName(item)}</Text>
                    <Text style={styles.waitingMeta}>
                      Visit #{item.visit.id} · {formatStatus(item.visit.status)}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>Everyone has been seen. 🎉</Text>
              )}
            />
          </>
        )}

        <View style={styles.footer}>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.exitButton}>
            Exit kiosk mode
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 24
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc'
  },
  offline: {
    color: '#f97316',
    fontSize: 16,
    fontWeight: '600'
  },
  timestamp: {
    color: '#cbd5f5',
    fontSize: 14
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 24,
    color: '#e2e8f0'
  },
  errorText: {
    fontSize: 22,
    color: '#fecdd3',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 16
  },
  emptyText: {
    fontSize: 22,
    color: '#94a3b8',
    textAlign: 'center'
  },
  nowServingCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8
  },
  nowServingLabel: {
    fontSize: 20,
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  nowServingName: {
    fontSize: 48,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center'
  },
  nowServingMeta: {
    fontSize: 20,
    color: '#cbd5f5'
  },
  waitingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e2e8f0'
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12
  },
  waitingPosition: {
    fontSize: 32,
    fontWeight: '700',
    color: '#38bdf8',
    width: 48
  },
  waitingInfo: {
    flex: 1
  },
  waitingName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f1f5f9'
  },
  waitingMeta: {
    fontSize: 16,
    color: '#cbd5f5',
    marginTop: 4
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  footer: {
    paddingBottom: 12
  },
  exitButton: {
    alignSelf: 'center',
    minWidth: 240
  }
});
