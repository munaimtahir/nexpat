import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Button, SegmentedButtons } from 'react-native-paper';
import { useVisits, useVisitMutation } from '@/api/hooks/useVisits';
import { VisitStatusTag } from '@/components/VisitStatusTag';
import { Card } from '@/components/Card';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';
import type { Visit } from '@/api/generated/types';
import { CachedDataNotice } from '@/components/CachedDataNotice';

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

  const visits = visitsQuery.data?.results ?? [];

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
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <CachedDataNotice />
      </View>
      <SegmentedButtons
        value={status}
        onValueChange={(newValue) => setStatus(newValue as Visit['status'] | 'all')}
        buttons={statusOptions.map((option) => ({ value: option.value, label: option.label }))}
        style={{ margin: 16 }}
      />
      <FlatList
        data={visits}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={visitsQuery.isRefetching} onRefresh={() => visitsQuery.refetch()} />}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Visit #{item.id}</Text>
            <VisitStatusTag status={item.status} />
            <Button 
              onPress={() => navigation.navigate('VisitDetail', { visitId: item.id })}
              accessibilityLabel={`View details for visit ${item.id}`}
              accessibilityHint="Opens visit detail page"
            >
              Open
            </Button>
            {nextStatus[item.status] ? (
              <Button 
                mode="contained" 
                onPress={() => onAdvance(item.id, item.status)} 
                loading={update.isPending}
                accessibilityLabel={`Advance visit ${item.id} to ${nextStatus[item.status]?.replace('_', ' ')}`}
                accessibilityHint={`Changes status from ${item.status} to ${nextStatus[item.status]}`}
              >
                Advance to {nextStatus[item.status]?.replace('_', ' ')}
              </Button>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={() => (
          <View style={{ padding: 24 }}>
            <Text style={{ textAlign: 'center', color: '#6b7280' }}>No visits</Text>
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
    </View>
  );
};
