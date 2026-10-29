import 'expo-sqlite/localStorage/install';

const prefix = 'nimzo.profile.';

export function readCachedProfile<T>(userId: string): T | null {
  try {
    const value = localStorage.getItem(prefix + userId);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export function writeCachedProfile<T>(userId: string, profile: T) {
  try {
    localStorage.setItem(prefix + userId, JSON.stringify(profile));
  } catch {
    return;
  }
}

export function clearCachedProfile(userId: string) {
  try {
    localStorage.removeItem(prefix + userId);
  } catch {
    return;
  }
}
