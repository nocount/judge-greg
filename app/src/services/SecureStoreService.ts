import * as SecureStore from 'expo-secure-store';

const API_KEY_STORE_KEY = 'judgegreg_anthropic_api_key';

export const SecureStoreService = {
  async saveApiKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(API_KEY_STORE_KEY, key);
  },

  async loadApiKey(): Promise<string | null> {
    return await SecureStore.getItemAsync(API_KEY_STORE_KEY);
  },

  async deleteApiKey(): Promise<void> {
    await SecureStore.deleteItemAsync(API_KEY_STORE_KEY);
  },
};
