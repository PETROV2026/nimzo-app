export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type Cipher = {
  encrypt(plain: string): Promise<string>;
  decrypt(sealed: string): Promise<string>;
};

const marker = 'enc1:';

export function utf8Encode(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

export function utf8Decode(bytes: Uint8Array): string {
  let text = '';
  let index = 0;
  while (index < bytes.length) {
    const first = bytes[index];
    let code: number;
    let length: number;
    if (first < 0x80) {
      code = first;
      length = 1;
    } else if (first < 0xe0) {
      code = first & 0x1f;
      length = 2;
    } else if (first < 0xf0) {
      code = first & 0x0f;
      length = 3;
    } else {
      code = first & 0x07;
      length = 4;
    }
    for (let next = 1; next < length; next += 1) {
      code = (code << 6) | (bytes[index + next] & 0x3f);
    }
    text += String.fromCodePoint(code);
    index += length;
  }
  return text;
}

export function createEncryptedStorage(store: KeyValueStore, loadCipher: () => Promise<Cipher>) {
  const memory = new Map<string, string>();

  async function save(key: string, value: string) {
    try {
      const cipher = await loadCipher();
      store.setItem(key, marker + (await cipher.encrypt(value)));
      memory.delete(key);
    } catch {
      store.removeItem(key);
      memory.set(key, value);
    }
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const kept = memory.get(key);
      if (kept !== undefined) return kept;

      const stored = store.getItem(key);
      if (stored === null) return null;
      if (!stored.startsWith(marker)) {
        await save(key, stored);
        return stored;
      }

      let cipher: Cipher;
      try {
        cipher = await loadCipher();
      } catch {
        return null;
      }
      try {
        return await cipher.decrypt(stored.slice(marker.length));
      } catch {
        store.removeItem(key);
        return null;
      }
    },
    async setItem(key: string, value: string) {
      await save(key, value);
    },
    async removeItem(key: string) {
      memory.delete(key);
      store.removeItem(key);
    },
  };
}
