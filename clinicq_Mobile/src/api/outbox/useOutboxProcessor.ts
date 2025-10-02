import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import { replayOutbox } from './replay';
import { logger } from '@/utils/logger';

const triggerReplay = async () => {
  try {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      await replayOutbox();
    }
  } catch (error) {
    logger.error('Outbox replay error', error);
  }
};

export const useOutboxProcessor = () => {
  useEffect(() => {
    triggerReplay();

    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        triggerReplay();
      }
    });

    const onAppStateChange = (status: AppStateStatus) => {
      if (status === 'active') {
        triggerReplay();
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);

    return () => {
      unsubscribeNetInfo();
      subscription.remove();
    };
  }, []);
};
