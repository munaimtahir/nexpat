import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SearchBar } from '@/components/SearchBar';
import { usePatients } from '@/api/hooks/usePatients';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';
import { Card } from '@/components/Card';
import { Button } from 'react-native-paper';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';

export const PatientsListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [search, setSearch] = useState('');
  const patientsQuery = usePatients({ search });

  useFocusEffect(
    React.useCallback(() => {
      patientsQuery.refetch();
    }, [patientsQuery])
  );

  const data = patientsQuery.data?.results ?? [];

  const renderItem = ({ item }: { item: (typeof data)[number] }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}>
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          {item.first_name} {item.last_name}
        </Text>
        {item.phone ? <Text style={{ marginTop: 4 }}>{item.phone}</Text> : null}
        {item.notes ? <Text style={{ marginTop: 4, color: '#6b7280' }}>{item.notes}</Text> : null}
      </Card>
    </TouchableOpacity>
  );

  if (patientsQuery.isLoading) {
    return <LoadingIndicator />;
  }

  if (patientsQuery.isError) {
    return <ErrorState message="Unable to load patients" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <SearchBar value={search} onChange={setSearch} placeholder="Search patients" />
      <Button mode="contained" onPress={() => navigation.navigate('PatientForm', {})} style={{ marginHorizontal: 16, marginBottom: 16 }}>
        Add patient
      </Button>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={patientsQuery.isRefetching} onRefresh={() => patientsQuery.refetch()} />}
        ListEmptyComponent={() => (
          <View style={{ padding: 24 }}>
            <Text style={{ textAlign: 'center', color: '#6b7280' }}>No patients yet</Text>
          </View>
        )}
      />
    </View>
  );
};
