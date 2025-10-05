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
    <TextureBackground variant="aurora">
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View entering={FadeInUp.duration(320)}>
          <Card variant="elevated">
            <Text style={styles.title}>Visit #{visit.id}</Text>
            <VisitStatusTag status={visit.status} />
            {visit.reason ? <Text style={styles.body}>{visit.reason}</Text> : null}
            {visit.notes ? <Text style={styles.notes}>{visit.notes}</Text> : null}
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
  notes: {
    color: 'rgba(226,232,240,0.7)',
    marginTop: 12
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
