import 'expo-sqlite/localStorage/install';

const key = 'nimzo.lastEmail';

export function readLastEmail() {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

export function writeLastEmail(email: string) {
  try {
    localStorage.setItem(key, email);
  } catch {
    return;
  }
}
