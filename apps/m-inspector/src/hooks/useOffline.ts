import {useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {SyncService} from '../services/sync';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable === true);
    });

    const syncUnsubscribe = SyncService.addSyncListener(() => {
      setIsSyncing(SyncService.isCurrentlySyncing());
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected === true && state.isInternetReachable === true);
    });

    return () => {
      unsubscribe();
      syncUnsubscribe();
    };
  }, []);

  return {isOnline, isSyncing};
}
