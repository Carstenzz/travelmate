import { View, Text, Button, Alert, Image } from 'react-native';
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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 24 }}>
      <Image
        source={require('../assets/foto.jpeg')}
        style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 18, borderWidth: 2, borderColor: '#e0e0e0' }}
        resizeMode="cover"
      />
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 2, color: '#222' }}>Carstenz Meru Phantara</Text>
      <Text style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>123220080</Text>
      <Text style={{ fontSize: 15, color: '#444', textAlign: 'center', marginBottom: 18 }}>
        A game developer wannabe who happens to be accepted in UPNYK's informatics major
      </Text>
      <View style={{ backgroundColor: '#e3f2fd', borderRadius: 14, padding: 16, marginBottom: 24, width: '100%' }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#1976d2' }}>Pesan & Kesan matkul TPM:</Text>
        <Text style={{ fontSize: 15, color: '#333' }}>
          Terima kasih pak bagus, berkat matkul TPM saya jadi tahu betapa pentingnya waktu tidur yang cukup. Matkulnya sangat menantang, 10/10 would definitely recommend
        </Text>
      </View>
      <Button title="Logout" onPress={handleLogout} color="#1976d2" />
    </View>
  );
}
