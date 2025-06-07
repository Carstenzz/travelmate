import { View, Text, Button, Alert } from 'react-native';
import { clearSession } from '../db/userSession';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const handleLogout = async () => {
    await clearSession();
    Alert.alert('Logout', 'Anda berhasil logout!');
    router.replace('/auth/login');
  };
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} className="bg-white">
      <Text className="bg-slate-950">Profilee Page</Text>
      <Button title="Logout" onPress={handleLogout} color="#d00" />
    </View>
  );
}
