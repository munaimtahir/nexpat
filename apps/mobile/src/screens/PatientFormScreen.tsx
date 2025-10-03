import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { AppStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePatient } from '@/api/hooks/usePatients';
import { usePatientMutations } from '@/api/hooks/usePatients';
import { LoadingIndicator } from '@/components/LoadingIndicator';

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export const PatientFormScreen: React.FC = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'PatientForm'>>();
  const patientId = route.params?.patientId;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const patientQuery = usePatient(patientId ?? 0);
  const { create, update } = usePatientMutations();
  const isEdit = Boolean(patientId);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { first_name: '', last_name: '', phone: '', notes: '' } });

  useEffect(() => {
    if (isEdit && patientQuery.data) {
      form.reset({
        first_name: patientQuery.data.first_name,
        last_name: patientQuery.data.last_name,
        phone: patientQuery.data.phone ?? '',
        notes: patientQuery.data.notes ?? ''
      });
    }
  }, [isEdit, patientQuery.data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (isEdit && patientId) {
      await update.mutateAsync({ id: patientId, ...values });
    } else {
      await create.mutateAsync(values);
    }
    navigation.goBack();
  });

  if (isEdit && patientQuery.isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Controller
        control={form.control}
        name="first_name"
        render={({ field: { value, onChange } }) => (
          <TextInput label="First name" style={styles.input} value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={form.control}
        name="last_name"
        render={({ field: { value, onChange } }) => (
          <TextInput label="Last name" style={styles.input} value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={form.control}
        name="phone"
        render={({ field: { value, onChange } }) => (
          <TextInput label="Phone" style={styles.input} value={value} onChangeText={onChange} keyboardType="phone-pad" />
        )}
      />
      <Controller
        control={form.control}
        name="notes"
        render={({ field: { value, onChange } }) => (
          <TextInput label="Notes" style={styles.input} value={value} onChangeText={onChange} multiline numberOfLines={3} />
        )}
      />

      <Button mode="contained" onPress={onSubmit} loading={create.isPending || update.isPending}>
        {isEdit ? 'Update patient' : 'Create patient'}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16
  },
  input: {
    backgroundColor: 'white'
  }
});
