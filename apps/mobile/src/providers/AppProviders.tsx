import React from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { navigationTheme, paperTheme } from '@/theme';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '@/features/auth/AuthContext';
import { AppNavigator } from '@/navigation';
import { useOutboxProcessor } from '@/api/outbox/useOutboxProcessor';
import { StatusBar } from 'expo-status-bar';
import { initSentry } from '@/providers/sentry';
import { initI18n } from '@/i18n';

initSentry();
initI18n();

focusManager.setEventListener((handleFocus) => {
  const onAppStateChange = (status: AppStateStatus) => {
    if (status === 'active') {
      handleFocus();
    }
  };

  const subscription = AppState.addEventListener('change', onAppStateChange);

  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      handleFocus();
    }
  });

  return () => {
    subscription.remove();
    unsubscribeNetInfo();
  };
});

export const AppProviders: React.FC = () => {
  useOutboxProcessor();

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 30
          },
          mutations: {
            retry: 0
          }
        }
      })
  );

  React.useEffect(() => {
    const persister = createAsyncStoragePersister({ storage: AsyncStorage });
    const [unsubscribe, restorePromise] = persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24
    });

    restorePromise.catch(() => {
      // noop
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <PaperProvider theme={paperTheme}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={navigationTheme}>
          <AuthProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </AuthProvider>
        </NavigationContainer>
      </QueryClientProvider>
    </PaperProvider>
  );
};
