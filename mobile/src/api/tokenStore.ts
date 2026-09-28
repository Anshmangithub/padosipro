import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'padosipro.authToken';

// Kept in memory too so the axios interceptor can read it synchronously on
// every request without an async SecureStore round-trip.
let inMemoryToken: string | null = null;

export function getToken(): string | null {
  return inMemoryToken;
}

export async function setToken(token: string | null): Promise<void> {
  inMemoryToken = token;
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

/** Reads the persisted token into memory on app boot. Returns it for convenience. */
export async function loadPersistedToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  inMemoryToken = token;
  return token;
}
