import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isOffline: boolean;
  netInfo?: NetInfoState;
}

const isOffline = (state: NetInfoState | null) => {
  if (!state) {
    return false;
  }

  if (state.isConnected === false) {
    return true;
  }

  if (state.isInternetReachable === false) {
    return true;
  }

  return false;
};

export const useNetworkStatus = (): NetworkStatus => {
  const [netInfo, setNetInfo] = useState<NetInfoState | null>(null);

  useEffect(() => {
    let isMounted = true;

    NetInfo.fetch().then((state) => {
      if (isMounted) {
        setNetInfo(state);
      }
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isMounted) {
        setNetInfo(state);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    isOffline: isOffline(netInfo),
    netInfo: netInfo ?? undefined
  };
};
