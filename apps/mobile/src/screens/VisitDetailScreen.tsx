import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { AppStackParamList } from '@/navigation/types';
import { useVisit, useVisitMutation } from '@/api/hooks/useVisits';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { VisitStatusTag } from '@/components/VisitStatusTag';
import { TextureBackground } from '@/components/TextureBackground';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import type { VisitStatus } from '@/api/generated/types';

const statusChoices: { label: string; value: VisitStatus }[] = [
  { label: 'Waiting', value: 'WAITING' },
  { label: 'Ready to start', value: 'START' },
  { label: 'In room', value: 'IN_ROOM' },
  { label: 'Done', value: 'DONE' }
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
    <TextureBackground variant="aurora">
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInUp.duration(320)}>
          <Card variant="elevated">
            <Text style={styles.title}>Visit #{visit.id}</Text>
            <VisitStatusTag status={visit.status} />
            <Text style={styles.body}>Patient: {visit.patient_full_name}</Text>
            <Text style={styles.body}>Queue: {visit.queue_name}</Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update status</Text>
              <View style={styles.buttons}>
                {statusChoices.map((choice) => (
                  <Button
                    key={choice.value}
                    label={choice.label}
                    variant={visit.status === choice.value ? 'primary' : 'glass'}
                    onPress={() => update.mutate({ id: visit.id, status: choice.value })}
                  />
                ))}
              </View>
            </View>
          </Card>
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
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700'
  },
  body: {
    color: '#E2E8F0',
    marginTop: 16,
    fontSize: 16
  },
  section: {
    marginTop: 24,
    gap: 16
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '600'
  },
  buttons: {
    gap: 12
  }
});
