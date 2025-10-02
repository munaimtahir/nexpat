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

  const visits = visitsQuery.data?.results ?? [];

  if (visitsQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (visitsQuery.isError) {
    return <ErrorState message="Unable to load visits" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <SegmentedButtons
        value={status}
        onValueChange={setStatus}
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
            {item.notes ? <Text style={{ marginTop: 8 }}>{item.notes}</Text> : null}
            <Button mode="contained" onPress={() => navigation.navigate('VisitDetail', { visitId: item.id })}>
              Open visit
            </Button>
            {item.status !== 'completed' ? (
              <Button mode="text" onPress={() => update.mutate({ id: item.id, status: 'completed' })}>
                Mark completed
              </Button>
            ) : null}
          </Card>
        )}
        ListEmptyComponent={() => (
          <View style={{ padding: 24 }}>
            <Text style={{ textAlign: 'center', color: '#6b7280' }}>No visits</Text>
          </View>
        )}
      />
    </View>
  );
};
