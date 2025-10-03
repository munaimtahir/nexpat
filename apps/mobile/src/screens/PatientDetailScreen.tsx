import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { AppStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePatient } from '@/api/hooks/usePatients';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { Button } from 'react-native-paper';
import { useVisitMutation } from '@/api/hooks/useVisits';
import { Card } from '@/components/Card';
import { VisitStatusTag } from '@/components/VisitStatusTag';
import { useVisits } from '@/api/hooks/useVisits';

export const PatientDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'PatientDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const patientQuery = usePatient(route.params.patientId);
  const visitsQuery = useVisits({});
  const visitMutation = useVisitMutation();

  if (patientQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (patientQuery.isError || !patientQuery.data) {
    return <ErrorState message="Patient not found" />;
  }

  const patient = patientQuery.data;
  const patientVisits = visitsQuery.data?.results.filter((visit) => visit.patient === patient.id) ?? [];

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>
          {patient.first_name} {patient.last_name}
        </Text>
        {patient.phone ? <Text style={{ marginTop: 8 }}>{patient.phone}</Text> : null}
        {patient.notes ? <Text style={{ marginTop: 8 }}>{patient.notes}</Text> : null}
      </View>

      <Button mode="contained" onPress={() => navigation.navigate('PatientForm', { patientId: patient.id })} style={{ marginBottom: 12 }}>
        Edit patient
      </Button>
      <Button
        mode="outlined"
        onPress={() => visitMutation.create.mutateAsync({ patient: patient.id, status: 'waiting' })}
        loading={visitMutation.create.isPending}
      >
        Add to queue
      </Button>

      <View style={{ marginTop: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Visits</Text>
        {patientVisits.length === 0 && <Text style={{ color: '#6b7280' }}>No visits yet</Text>}
        {patientVisits.map((visit) => (
          <Card key={visit.id}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{visit.reason ?? 'Visit'}</Text>
            <VisitStatusTag status={visit.status} />
            <Button mode="text" onPress={() => navigation.navigate('VisitDetail', { visitId: visit.id })}>
              Open visit
            </Button>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};
