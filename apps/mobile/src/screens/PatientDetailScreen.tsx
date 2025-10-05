import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { AppStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { usePatient } from '@/api/hooks/usePatients';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { useVisits } from '@/api/hooks/useVisits';
import { TextureBackground } from '@/components/TextureBackground';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { VisitStatusTag } from '@/components/VisitStatusTag';

export const PatientDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'PatientDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const registrationNumber = route.params.registrationNumber;
  const patientQuery = usePatient(registrationNumber);
  const visitsQuery = useVisits({});

  if (patientQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (patientQuery.isError || !patientQuery.data) {
    return <ErrorState message="Patient not found" />;
  }

  const patient = patientQuery.data;
  const patientVisits =
    visitsQuery.data?.results.filter(
      (visit) => visit.patient_registration_number === patient.registration_number
    ) ?? [];

  return (
    <TextureBackground variant="aurora">
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInUp.duration(300)}>
          <View style={styles.header}>
            <Text style={styles.name}>
              {patient.name}
            </Text>
            <Text style={styles.meta}>Registration #{patient.registration_number}</Text>
            {patient.phone ? <Text style={styles.meta}>{patient.phone}</Text> : null}
            <Text style={styles.meta}>Gender: {patient.gender}</Text>
          </View>
          <View style={styles.actions}>
            <Button
              label="Edit patient"
              onPress={() =>
                navigation.navigate('PatientForm', {
                  registrationNumber: patient.registration_number
                })
              }
            />
          </View>
          <View style={styles.visits}>
            <Text style={styles.sectionTitle}>Visits</Text>
            {patientVisits.length === 0 ? <Text style={styles.emptyText}>No visits yet</Text> : null}
            {patientVisits.map((visit) => (
              <Animated.View key={visit.id} layout={Layout.springify()}>
                <Card variant="elevated" onPress={() => navigation.navigate('VisitDetail', { visitId: visit.id })}>
                  <Text style={styles.visitTitle}>
                    Visit #{visit.id} · {visit.queue_name}
                  </Text>
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
