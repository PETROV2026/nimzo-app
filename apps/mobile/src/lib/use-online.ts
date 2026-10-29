import { useNetworkState } from 'expo-network';

export function useOnline() {
  const { isConnected, isInternetReachable } = useNetworkState();
  return isConnected !== false && isInternetReachable !== false;
}
