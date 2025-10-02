import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export type LoginForm = z.infer<typeof schema>;

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { control, handleSubmit, formState, setError } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' }
  });
  const { t } = useTranslation();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values);
    } catch (error) {
      setError('root', { message: 'Invalid credentials', type: 'manual' });
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('login.title')}</Text>
      <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

      <Controller
        control={control}
        name="username"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label={t('login.username')}
            autoCapitalize="none"
            style={styles.input}
            value={value}
            onChangeText={onChange}
            error={!!formState.errors.username}
            accessibilityLabel={t('login.username')}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange } }) => (
          <TextInput
            label={t('login.password')}
            secureTextEntry
            style={styles.input}
            value={value}
            onChangeText={onChange}
            error={!!formState.errors.password}
            accessibilityLabel={t('login.password')}
          />
        )}
      />

      <Button mode="contained" onPress={onSubmit} loading={isLoading} accessibilityRole="button" style={styles.button}>
        {t('login.submit')}
      </Button>

      {formState.errors.root && <Text style={styles.error}>{formState.errors.root.message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24
  },
  input: {
    marginBottom: 16
  },
  button: {
    marginTop: 8
  },
  error: {
    color: 'red',
    marginTop: 12
  }
});
