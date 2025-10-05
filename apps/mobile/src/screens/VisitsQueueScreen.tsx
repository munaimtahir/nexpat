import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, Layout, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVisits, useVisitMutation } from '@/api/hooks/useVisits';
import { VisitStatusTag } from '@/components/VisitStatusTag';
import { Card } from '@/components/Card';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { CachedDataNotice } from '@/components/CachedDataNotice';
import { TextureBackground } from '@/components/TextureBackground';
import { FilterChips } from '@/components/FilterChips';
import { Button } from '@/components/Button';
import type { Visit } from '@/api/generated/types';
import type { AppStackParamList } from '@/navigation/types';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Visit>);

const statusOptions = [
  { value: 'waiting', label: 'Waiting' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' }
];

const nextStatus: Record<Visit['status'], Visit['status'] | null> = {
  waiting: 'in_progress',
  in_progress: 'completed',
  completed: null,
  cancelled: null
};

export const VisitsQueueScreen: React.FC = () => {
  const [status, setStatus] = useState<Visit['status'] | 'all'>('waiting');
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const visitsQuery = useVisits({ status: status === 'all' ? undefined : status });
  const { update } = useVisitMutation();
  const refreshOverlay = useSharedValue(0);

  const visits = visitsQuery.data?.results ?? [];

  useEffect(() => {
    refreshOverlay.value = withTiming(visitsQuery.isRefetching ? 1 : 0, { duration: 250 });
  }, [refreshOverlay, visitsQuery.isRefetching]);

  const refreshStyle = useAnimatedStyle(() => ({
    opacity: refreshOverlay.value
  }));

  const onAdvance = (id: number, currentStatus: Visit['status']) => {
    const target = nextStatus[currentStatus];
    if (target) {
      update.mutate({ id, status: target });
    }
  };

  if (visitsQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (visitsQuery.isError) {
    return <ErrorState message="Unable to load visits" />;
  }

  return (
    <TextureBackground variant="sunset">
      <View style={styles.noticeWrapper}>
        <CachedDataNotice />
      </View>
      <FilterChips value={status} options={statusOptions} onChange={(value) => setStatus(value as Visit['status'] | 'all')} />
      <Animated.View style={[styles.refreshBanner, refreshStyle]} pointerEvents="none">
        <Text style={styles.refreshText}>Refreshing queue…</Text>
      </Animated.View>
      <AnimatedFlatList
        data={visits}
        keyExtractor={(item) => String(item.id)}
        entering={FadeInUp.duration(320)}
        refreshControl={<RefreshControl refreshing={visitsQuery.isRefetching} onRefresh={() => visitsQuery.refetch()} tintColor="#fff" />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Visit #{item.id}</Text>
            <VisitStatusTag status={item.status} />
            <Button 
              onPress={() => navigation.navigate('VisitDetail', { visitId: item.id })}
            >
              Open
            </Button>
            {nextStatus[item.status] ? (
              <Button 
                onPress={() => onAdvance(item.id, item.status)} 
              >
                Advance to {nextStatus[item.status]?.replace('_', ' ')}
              </Button>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No visits</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh the live queue.</Text>
          </View>
        )}
        accessibilityLabel="Visits queue list"
        // Performance optimizations
        windowSize={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        initialNumToRender={15}
      />
    </TextureBackground>
  );
};

const styles = StyleSheet.create({
  noticeWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  refreshBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(248,113,113,0.18)',
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8
  },
  refreshText: {
    color: '#FFE4E6',
    fontWeight: '600'
  },
  listContent: {
    paddingBottom: 160
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap'
  },
  emptyState: {
    padding: 32,
    alignItems: 'center'
  },
  emptyText: {
    color: '#FEE2E2',
    fontSize: 18,
    fontWeight: '600'
  },
  emptySubtext: {
    color: 'rgba(254,226,226,0.7)',
    marginTop: 8
  }
});
