import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createEncryptedStorage, utf8Decode, utf8Encode } from '../src/lib/encrypted-storage.ts';

function memoryStore() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

const reversing = async () => ({
  encrypt: async (plain: string) => [...plain].reverse().join(''),
  decrypt: async (sealed: string) => [...sealed].reverse().join(''),
});

const broken = async () => {
  throw new Error('keystore unavailable');
};

const SESSION = '{"access_token":"token","user":{"full_name":"Técnica Peña 🔥"}}';

describe('utf8', () => {
  test('round-trips accents and emoji', () => {
    const bytes = utf8Encode(SESSION);
    assert.deepEqual(bytes, new Uint8Array(Buffer.from(SESSION, 'utf8')));
    assert.equal(utf8Decode(bytes), SESSION);
  });
});

describe('encrypted storage', () => {
  test('never writes the session in plain text and reads it back', async () => {
    const store = memoryStore();
    const storage = createEncryptedStorage(store, reversing);
    await storage.setItem('sb-auth', SESSION);
    const saved = store.values.get('sb-auth') ?? '';
    assert.ok(saved.startsWith('enc1:'));
    assert.ok(!saved.includes('access_token'));
    assert.equal(await storage.getItem('sb-auth'), SESSION);
  });

  test('a session saved before encryption is kept and encrypted on first read', async () => {
    const store = memoryStore();
    store.setItem('sb-auth', SESSION);
    const storage = createEncryptedStorage(store, reversing);
    assert.equal(await storage.getItem('sb-auth'), SESSION);
    assert.ok(store.values.get('sb-auth')?.startsWith('enc1:'));
    assert.equal(await storage.getItem('sb-auth'), SESSION);
  });

  test('a session that cannot be decrypted is removed so the technician signs in again', async () => {
    const store = memoryStore();
    store.setItem('sb-auth', 'enc1:garbage');
    const storage = createEncryptedStorage(store, async () => ({
      encrypt: async (plain: string) => plain,
      decrypt: async () => {
        throw new Error('bad tag');
      },
    }));
    assert.equal(await storage.getItem('sb-auth'), null);
    assert.equal(store.values.has('sb-auth'), false);
  });

  test('a key that is briefly unavailable does not delete the saved session', async () => {
    const store = memoryStore();
    store.setItem('sb-auth', 'enc1:sealed');
    assert.equal(await createEncryptedStorage(store, broken).getItem('sb-auth'), null);
    assert.equal(store.values.get('sb-auth'), 'enc1:sealed');
  });

  test('without a working key the session lives only in memory, never on disk', async () => {
    const store = memoryStore();
    const storage = createEncryptedStorage(store, broken);
    await storage.setItem('sb-auth', SESSION);
    assert.equal(store.values.has('sb-auth'), false);
    assert.equal(await storage.getItem('sb-auth'), SESSION);

    const legacy = memoryStore();
    legacy.setItem('sb-auth', SESSION);
    assert.equal(await createEncryptedStorage(legacy, broken).getItem('sb-auth'), SESSION);
  });

  test('removing clears both the disk and the memory copy', async () => {
    const store = memoryStore();
    const storage = createEncryptedStorage(store, broken);
    await storage.setItem('sb-auth', SESSION);
    await storage.removeItem('sb-auth');
    assert.equal(await storage.getItem('sb-auth'), null);
  });
});
