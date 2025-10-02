import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: { serverUrl: 'http://localhost:8000', sentryDsn: '' } }
  }
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/tmp',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn()
}));

jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn()
}));

jest.mock('react-native-encrypted-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined)
}));
