import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, Layout, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchBar } from '@/components/SearchBar';
import { usePatients } from '@/api/hooks/usePatients';
import type { AppStackParamList } from '@/navigation/types';
import { Card } from '@/components/Card';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { CachedDataNotice } from '@/components/CachedDataNotice';
import { TextureBackground } from '@/components/TextureBackground';
import { Button } from '@/components/Button';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export const PatientsListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [search, setSearch] = useState('');
  const patientsQuery = usePatients({ search });
  const refreshOverlay = useSharedValue(0);

  useFocusEffect(
    React.useCallback(() => {
      patientsQuery.refetch();
    }, [patientsQuery])
  );

  const data = patientsQuery.data?.results ?? [];

  React.useEffect(() => {
    refreshOverlay.value = withTiming(patientsQuery.isRefetching ? 1 : 0, { duration: 250 });
  }, [patientsQuery.isRefetching, refreshOverlay]);

  const refreshStyle = useAnimatedStyle(() => ({ opacity: refreshOverlay.value }));

  const renderItem = ({ item }: { item: (typeof data)[number] }) => (
    <Animated.View layout={Layout.springify()}>
      <TouchableOpacity onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}>
        <Card variant="elevated">
          <Text style={styles.cardTitle}>
            {item.first_name} {item.last_name}
          </Text>
          {item.phone ? <Text style={styles.cardMeta}>{item.phone}</Text> : null}
          {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  if (patientsQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (patientsQuery.isError) {
    return <ErrorState message="Unable to load patients" />;
  }

  return (
    <TextureBackground variant="aurora">
      <View style={styles.noticeWrapper}>
        <CachedDataNotice />
      </View>
      <View style={styles.searchWrapper}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search patients" />
        <Button label="Add patient" onPress={() => navigation.navigate('PatientForm', {})} style={styles.addButton} />
      </View>
      <Animated.View style={[styles.refreshBanner, refreshStyle]} pointerEvents="none">
        <Text style={styles.refreshText}>Syncing roster…</Text>
      </Animated.View>
      <AnimatedFlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        entering={FadeInUp.duration(320)}
        refreshControl={<RefreshControl refreshing={patientsQuery.isRefetching} onRefresh={() => patientsQuery.refetch()} tintColor="#fff" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No patients yet</Text>
            <Text style={styles.emptySubtext}>Add your first patient to get started.</Text>
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
  searchWrapper: {
    paddingHorizontal: 16,
    gap: 12
  },
  addButton: {
    marginTop: 8
  },
  refreshBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(14,165,233,0.18)',
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8
  },
  refreshText: {
    color: '#CFFAFE',
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
  cardMeta: {
    color: '#BAE6FD',
    marginTop: 6
  },
  cardNotes: {
    color: '#BFDBFE',
    marginTop: 6
  },
  emptyState: {
    padding: 32,
    alignItems: 'center'
  },
  emptyText: {
    color: '#E0F2FE',
    fontSize: 18,
    fontWeight: '600'
  },
  emptySubtext: {
    color: 'rgba(224,242,254,0.7)',
    marginTop: 8
  }
});
