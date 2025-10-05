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
import type { AppStackParamList } from '@/navigation/types';
import { CachedDataNotice } from '@/components/CachedDataNotice';
import { TextureBackground } from '@/components/TextureBackground';
import { FilterChips } from '@/components/FilterChips';
import { Button } from '@/components/Button';
import type { Visit } from '@/api/generated/types';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Visit>);

const statusOptions = [
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' }
];

export const DoctorQueueScreen: React.FC = () => {
  const [status, setStatus] = useState('in_progress');
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

  if (visitsQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (visitsQuery.isError) {
    return <ErrorState message="Unable to load visits" />;
  }

  return (
    <TextureBackground variant="aurora">
      <View style={styles.noticeWrapper}>
        <CachedDataNotice />
      </View>
      <FilterChips value={status} options={statusOptions} onChange={setStatus} />
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
          <Animated.View layout={Layout.springify()}>
            <Card variant="elevated" onPress={() => navigation.navigate('VisitDetail', { visitId: item.id })}>
              <Text style={styles.cardTitle}>Visit #{item.id}</Text>
              <VisitStatusTag status={item.status} />
              {item.notes ? <Text style={styles.cardBody}>{item.notes}</Text> : null}
              <View style={styles.actions}>
                <Button label="Open visit" onPress={() => navigation.navigate('VisitDetail', { visitId: item.id })} />
                {item.status !== 'completed' ? (
                  <Button
                    label="Mark completed"
                    variant="glass"
                    onPress={() => update.mutate({ id: item.id, status: 'completed' })}
                    loading={update.isPending}
                  />
                ) : null}
              </View>
            </Card>
          </Animated.View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No visits right now.</Text>
            <Text style={styles.emptySubtext}>Great time to review patient notes.</Text>
          </View>
        )}
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
    backgroundColor: 'rgba(99,102,241,0.16)',
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8
  },
  refreshText: {
    color: '#E0E7FF',
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
  cardBody: {
    color: '#CBD5F5'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap'
  },
  emptyState: {
    padding: 32,
    alignItems: 'center'
  },
  emptyText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600'
  },
  emptySubtext: {
    color: 'rgba(226,232,240,0.7)',
    marginTop: 8
  }
});
