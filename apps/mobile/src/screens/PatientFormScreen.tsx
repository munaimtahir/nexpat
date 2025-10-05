import React, { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { AppStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePatient, usePatientMutations } from '@/api/hooks/usePatients';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import type { PatientGender } from '@/api/generated/types';

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('OTHER')
});

type FormValues = z.infer<typeof schema>;

export const PatientFormScreen: React.FC = () => {
  const route = useRoute<RouteProp<AppStackParamList, 'PatientForm'>>();
  const registrationNumber = route.params?.registrationNumber;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const patientQuery = usePatient(registrationNumber);
  const { create, update } = usePatientMutations();
  const isEdit = Boolean(registrationNumber);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', gender: 'OTHER' }
  });

  useEffect(() => {
    if (isEdit && patientQuery.data) {
      form.reset({
        name: patientQuery.data.name,
        phone: patientQuery.data.phone ?? '',
        gender: patientQuery.data.gender as PatientGender
      });
    }
  }, [isEdit, patientQuery.data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      phone: values.phone?.trim() ? values.phone.trim() : null,
      gender: values.gender as PatientGender
    };

    if (isEdit && registrationNumber) {
      await update.mutateAsync({ registrationNumber, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    navigation.goBack();
  });

  if (isEdit && patientQuery.isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isEdit && registrationNumber ? (
        <TextInput label="Registration number" style={styles.input} value={registrationNumber} disabled />
      ) : null}
      <Controller
        control={form.control}
        name="name"
        render={({ field: { value, onChange } }) => (
          <TextInput label="Full name" style={styles.input} value={value} onChangeText={onChange} />
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
        name="gender"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label="Gender (MALE, FEMALE, OTHER)"
            style={styles.input}
            value={value}
            onChangeText={(text) => onChange(text.toUpperCase())}
          />
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
