import 'expo-sqlite/localStorage/install';
import {
  AESEncryptionKey,
  AESKeySize,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { type Cipher, createEncryptedStorage, utf8Decode, utf8Encode } from './encrypted-storage';

const keyName = 'nimzo.session-key';

async function loadKey() {
  const saved = await SecureStore.getItemAsync(keyName);
  if (saved) return AESEncryptionKey.import(saved, 'base64');
  const key = await AESEncryptionKey.generate(AESKeySize.AES256);
  await SecureStore.setItemAsync(keyName, await key.encoded('base64'));
  return key;
}

let cipher: Promise<Cipher> | null = null;

function loadCipher() {
  cipher ??= loadKey().then(
    (key): Cipher => ({
      async encrypt(plain) {
        const sealed = await aesEncryptAsync(utf8Encode(plain), key);
        return sealed.combined('base64');
      },
      async decrypt(sealed) {
        const bytes = await aesDecryptAsync(AESSealedData.fromCombined(sealed), key, {
          output: 'bytes',
        });
        return utf8Decode(bytes);
      },
    }),
    (error: unknown) => {
      cipher = null;
      throw error;
    },
  );
  return cipher;
}

export const authStorage = createEncryptedStorage(localStorage, loadCipher);
