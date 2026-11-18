import { useNetworkState } from 'expo-network';
import { useEffect, useState } from 'react';

const offlineDelayMs = 8000;
const onlineDelayMs = 3000;

export function useOnline() {
  const { isConnected, isInternetReachable } = useNetworkState();
  return isConnected !== false && isInternetReachable !== false;
}

export function useSettledOnline() {
  const online = useOnline();
  const [settled, setSettled] = useState(online);

  useEffect(() => {
    if (online === settled) return;
    const timer = setTimeout(() => setSettled(online), online ? onlineDelayMs : offlineDelayMs);
    return () => clearTimeout(timer);
  }, [online, settled]);

  return settled;
}
