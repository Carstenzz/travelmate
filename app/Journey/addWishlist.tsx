import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addWishlist } from '../../db/firebaseApi';
import { getLocationNameFromCoords } from '../../utils/reverseGeocode';
import SelectLocationModal from './modal.selectLocation';

export default function AddWishlistScreen() {
  const router = useRouter();
  const [placeName, setPlaceName] = useState('');
  const [coordinate, setCoordinate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const pickLocationOnMap = async () => {
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!placeName) {
      Alert.alert('Error', 'Nama tempat wajib diisi');
      return;
    }
    setLoading(true);
    const sessionStr = await AsyncStorage.getItem('@travelmate/user_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    if (!session || !session.user_id) {
      Alert.alert('Error', 'Session tidak ditemukan');
      setLoading(false);
      return;
    }
    try {
      await addWishlist({
        user_id: session.user_id,
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
      <Text style={styles.title}>Tambah Wishlist</Text>
      <TextInput placeholder="Nama Tempat" value={placeName} onChangeText={setPlaceName} style={styles.input} />
      <TouchableOpacity style={styles.locationButton} onPress={pickLocationOnMap} disabled={selecting}>
        <Text style={styles.locationButtonText}>{selecting ? 'Memilih lokasi...' : (location ? 'Perbarui Lokasi' : 'Pilih Lokasi di Map')}</Text>
      </TouchableOpacity>
      <SelectLocationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={async (lat, lon, address) => {
          setCoordinate(`${lat},${lon}`);
          setLocation(address);
        }}
      />
      {location ? (
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>Lokasi:</Text>
          <Text style={styles.locationValue}>{location}</Text>
          <Text style={styles.locationLabel}>Koordinat:</Text>
          <Text style={styles.locationValue}>{coordinate}</Text>
        </View>
      ) : null}
      <Button title={loading ? 'Menyimpan...' : 'Simpan'} onPress={handleSave} disabled={loading} />
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
