import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
export function obterAuth(app) {
  try { return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); }
  catch (e) { if (e.code !== 'auth/already-initialized') throw e; return getAuth(app); }
}
