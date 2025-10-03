import EncryptedStorage from 'react-native-encrypted-storage';

export const secureStore = {
  getString: async (key: string) => {
    try {
      return await EncryptedStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  setString: async (key: string, value: string) => {
    await EncryptedStorage.setItem(key, value);
  },
  remove: async (key: string) => {
    await EncryptedStorage.removeItem(key);
  }
};
