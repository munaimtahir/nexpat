import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import Constants from 'expo-constants';
import { useHealth } from '@/api/hooks/useDiagnostics';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '@/navigation/types';

export const DiagnosticsScreen: React.FC = () => {
  const health = useHealth();
  const { refreshProfile, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const appVersion = Constants.expoConfig?.version ?? 'dev';
  const buildNumber =
    Constants.expoConfig?.android?.versionCode?.toString() ??
    Constants.expoConfig?.extra?.eas?.build?.gitCommitHash ??
    'n/a';

  if (health.isLoading) {
    return <LoadingIndicator />;
  }

  if (health.isError) {
    return <ErrorState message="Diagnostics unavailable" />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Diagnostics</Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Health</Text>
        <Text>Status: {health.data?.status}</Text>
        <Text>Service: {health.data?.service}</Text>
        <Text>Timestamp: {health.data?.timestamp}</Text>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Version</Text>
        <Text>App version: {appVersion}</Text>
        <Text>Build: {buildNumber}</Text>
      </View>

      <Button mode="outlined" onPress={() => health.refetch()} style={{ marginBottom: 12 }}>
        Refresh diagnostics
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('PublicDisplay')}
        style={{ marginBottom: 12 }}
      >
        Open public display
      </Button>
      <Button mode="outlined" onPress={() => refreshProfile()} style={{ marginBottom: 12 }}>
        Refresh profile
      </Button>
      <Button mode="contained" onPress={() => logout()}>
        Log out
      </Button>
    </ScrollView>
  );
};
