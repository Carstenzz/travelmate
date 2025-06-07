import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, Image, ActionSheetIOS, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addTravelNote } from '../../db/firebaseApi';
import { getLocationNameFromCoords } from '../../utils/reverseGeocode';

export default function AddNoteScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [coordinate, setCoordinate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const pickImage = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Batal', 'Ambil Foto', 'Pilih dari Galeri'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Kamera
            const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setPhotoUri(result.assets[0].uri);
            }
          } else if (buttonIndex === 2) {
            // Galeri
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setPhotoUri(result.assets[0].uri);
            }
          }
        }
      );
    } else {
      // Android: pakai alert sederhana
      Alert.alert(
        'Pilih Sumber Foto',
        '',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Kamera',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setPhotoUri(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Galeri',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                setPhotoUri(result.assets[0].uri);
              }
            },
          },
        ]
      );
    }
  };

  const getLocationFromGPS = async () => {
    setGettingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Izin lokasi ditolak');
        setGettingLocation(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setCoordinate(`${lat},${lon}`);
      // Pakai helper reverse geocode
      const displayName = await getLocationNameFromCoords(lat, lon);
      setLocation(displayName);
    } catch (e) {
      Alert.alert('Error', 'Gagal mengambil lokasi');
    }
    setGettingLocation(false);
  };

  const handleSave = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Title dan deskripsi wajib diisi');
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
      await addTravelNote({
        user_id: session.user_id,
        title,
        description,
        photo_url: photoUri || '',
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
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity style={styles.photoInput} onPress={pickImage}>
          <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoInputImage} />
            ) : (
              <>
                <Text style={{ fontSize: 40, color: '#888' }}>📷</Text>
                <Text style={styles.photoInputText}>Tambah Foto (opsional)</Text>
              </>
            )}
            {photoUri ? (
              <Text style={styles.photoInputText}>Ganti Foto</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
      <TextInput placeholder="Judul" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Deskripsi" value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} multiline />
      <TouchableOpacity style={styles.locationButton} onPress={getLocationFromGPS} disabled={gettingLocation}>
        <Text style={styles.locationButtonText}>{gettingLocation ? 'Mengambil lokasi...' : (location ? 'Perbarui Lokasi' : 'Gunakan Lokasi (opsional)')}</Text>
      </TouchableOpacity>
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
  photoInput: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 14,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
    marginBottom: 8,
    width: 320,
    height: 200,
    overflow: 'hidden',
  },
  photoInputImage: {
    width: 320,
    height: 230,
    borderRadius: 14,
    resizeMode: 'cover',
  },
  photoInputText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  previewImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
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
