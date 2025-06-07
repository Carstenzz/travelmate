import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getWishlistById, updateWishlist } from '../../db/firebaseApi';
import { getLocationNameFromCoords } from '../../utils/reverseGeocode';

export default function EditWishlistScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [placeName, setPlaceName] = useState('');
  const [coordinate, setCoordinate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const wish = await getWishlistById(id as string);
      if (wish) {
        setPlaceName(wish.place_name);
        setLocation(wish.location || '');
        setCoordinate(wish.coordinate || '');
      }
    })();
  }, [id]);

  // Dummy map picker, replace with real map picker page/modal
  const pickLocationOnMap = async () => {
    setSelecting(true);
    const lat = -7.085097;
    const lon = 111.0;
    setCoordinate(`${lat},${lon}`);
    const displayName = await getLocationNameFromCoords(lat, lon);
    setLocation(displayName);
    setSelecting(false);
  };

  const handleSave = async () => {
    if (!placeName) {
      Alert.alert('Error', 'Nama tempat wajib diisi');
      return;
    }
    setLoading(true);
    try {
      // Ambil user_id dari session
      const sessionStr = await require('@react-native-async-storage/async-storage').default.getItem('@travelmate/user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const user_id = session && session.user_id ? session.user_id : '';
      await updateWishlist(id as string, {
        user_id, // pastikan user_id selalu dikirim
        place_name: placeName,
        location: location || '',
        coordinate: coordinate || '',
      });
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
    router.replace('/Journey/notes');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Wishlist</Text>
      <TextInput placeholder="Nama Tempat" value={placeName} onChangeText={setPlaceName} style={styles.input} />
      <TouchableOpacity style={styles.locationButton} onPress={pickLocationOnMap} disabled={selecting}>
        <Text style={styles.locationButtonText}>{selecting ? 'Memilih lokasi...' : (location ? 'Perbarui Lokasi' : 'Pilih Lokasi di Map')}</Text>
      </TouchableOpacity>
      {location ? (
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>Lokasi:</Text>
          <Text style={styles.locationValue}>{location}</Text>
          <Text style={styles.locationLabel}>Koordinat:</Text>
          <Text style={styles.locationValue}>{coordinate}</Text>
        </View>
      ) : null}
      <Button title={loading ? 'Menyimpan...' : 'Simpan Perubahan'} onPress={handleSave} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', paddingTop: 36 },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
  locationButton: {
    backgroundColor: '#34a853',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  locationBox: {
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  locationLabel: {
    fontWeight: 'bold',
    color: '#555',
    fontSize: 13,
  },
  locationValue: {
    color: '#333',
    fontSize: 13,
    marginBottom: 4,
  },
});
