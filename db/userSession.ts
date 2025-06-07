import AsyncStorage from '@react-native-async-storage/async-storage';

export const SESSION_KEY = '@travelmate/user_session';

export async function getSession() {
  const session = await AsyncStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
