import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { AppStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { usePatient } from '@/api/hooks/usePatients';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { useVisitMutation, useVisits } from '@/api/hooks/useVisits';
import { TextureBackground } from '@/components/TextureBackground';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { VisitStatusTag } from '@/components/VisitStatusTag';

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
    <TextureBackground variant="aurora">
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInUp.duration(300)}>
          <View style={styles.header}>
            <Text style={styles.name}>
              {patient.first_name} {patient.last_name}
            </Text>
            {patient.phone ? <Text style={styles.meta}>{patient.phone}</Text> : null}
            {patient.notes ? <Text style={styles.meta}>{patient.notes}</Text> : null}
          </View>
          <View style={styles.actions}>
            <Button label="Edit patient" onPress={() => navigation.navigate('PatientForm', { patientId: patient.id })} />
            <Button
              label="Add to queue"
              variant="glass"
              onPress={() => visitMutation.create.mutateAsync({ patient: patient.id, status: 'waiting' })}
              loading={visitMutation.create.isPending}
            />
          </View>
          <View style={styles.visits}>
            <Text style={styles.sectionTitle}>Visits</Text>
            {patientVisits.length === 0 ? <Text style={styles.emptyText}>No visits yet</Text> : null}
            {patientVisits.map((visit) => (
              <Animated.View key={visit.id} layout={Layout.springify()}>
                <Card variant="elevated" onPress={() => navigation.navigate('VisitDetail', { visitId: visit.id })}>
                  <Text style={styles.visitTitle}>{visit.reason ?? 'Visit'}</Text>
                  <VisitStatusTag status={visit.status} variant="glass" />
                  <Button
                    label="Open visit"
                    variant="secondary"
                    onPress={() => navigation.navigate('VisitDetail', { visitId: visit.id })}
                  />
                </Card>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </TextureBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120
  },
  header: {
    gap: 8
  },
  name: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700'
  },
  meta: {
    color: '#CBD5F5'
  },
  actions: {
    marginTop: 24,
    gap: 12
  },
  visits: {
    marginTop: 32,
    gap: 16
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600'
  },
  emptyText: {
    color: 'rgba(248,250,252,0.7)'
  },
  visitTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600'
  }
});
