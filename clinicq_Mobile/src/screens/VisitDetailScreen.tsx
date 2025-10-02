import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import type { AppStackParamList } from '@/navigation/types';
import { useVisit, useVisitMutation } from '@/api/hooks/useVisits';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { VisitStatusTag } from '@/components/VisitStatusTag';
import { Button } from 'react-native-paper';

const statusChoices: { label: string; value: any }[] = [
  { label: 'Waiting', value: 'waiting' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
];

export const VisitDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'VisitDetail'>>();
  const visitQuery = useVisit(route.params.visitId);
  const { update } = useVisitMutation();

  if (visitQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (visitQuery.isError || !visitQuery.data) {
    return <ErrorState message="Visit not found" />;
  }

  const visit = visitQuery.data;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Visit #{visit.id}</Text>
      <VisitStatusTag status={visit.status} />
      {visit.reason ? <Text style={{ marginTop: 16, fontSize: 16 }}>{visit.reason}</Text> : null}
      {visit.notes ? <Text style={{ marginTop: 8, color: '#6b7280' }}>{visit.notes}</Text> : null}

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Update status</Text>
        {statusChoices.map((choice) => (
          <Button
            key={choice.value}
            mode={visit.status === choice.value ? 'contained' : 'outlined'}
            style={{ marginBottom: 12 }}
            onPress={() => update.mutate({ id: visit.id, status: choice.value })}
          >
            {choice.label}
          </Button>
        ))}
      </View>
    </ScrollView>
  );
};
