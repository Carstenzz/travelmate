import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, Image, ActionSheetIOS, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getTravelNoteById, updateTravelNote } from '../../db/firebaseApi';
import { getLocationNameFromCoords } from '../../utils/reverseGeocode';

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [location, setLocation] = useState('');
  const [coordinate, setCoordinate] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const note = await getTravelNoteById(id as string);
      if (note) {
        setTitle(note.title);
        setDescription(note.description);
        setPhotoUri(note.photo_url || '');
        setLocation(note.location || '');
        setCoordinate(note.coordinate || '');
      }
    })();
  }, [id]);

  const pickImage = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Batal', 'Ambil Foto', 'Pilih dari Galeri'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setPhotoUri(result.assets[0].uri);
            }
          } else if (buttonIndex === 2) {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setPhotoUri(result.assets[0].uri);
            }
          }
        }
      );
    } else {
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

  // Ambil lokasi otomatis
  const getLocationFromGPS = async () => {
    setGettingLocation(true);
    try {
      let { status } = await require('expo-location').requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Izin lokasi ditolak');
        setGettingLocation(false);
        return;
      }
      let loc = await require('expo-location').getCurrentPositionAsync({ accuracy: require('expo-location').Accuracy.High });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setCoordinate(`${lat},${lon}`);
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
    try {
      await updateTravelNote(id as string, {
        title,
        description,
        photo_url: photoUri || '',
        location: location || '',
        coordinate: coordinate || '',
      });
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Gagal mengupdate note');
    }
    setLoading(false);
    router.replace('/Journey/notes');
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <TouchableOpacity style={styles.photoInput} onPress={pickImage}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 32, color: '#888' }}>📷</Text>
            <Text style={styles.photoInputText}>{photoUri ? 'Ganti Foto' : 'Tambah Foto (opsional)'}</Text>
          </View>
        </TouchableOpacity>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.previewImage} /> : null}
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
      <Button title={loading ? 'Menyimpan...' : 'Simpan Perubahan'} onPress={handleSave} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', paddingTop: 36 },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
  photoButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  photoButtonText: { color: '#fff', fontWeight: 'bold' },
  image: { width: 220, height: 120, borderRadius: 8, marginBottom: 8, alignSelf: 'center' },
  photoInput: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
    marginBottom: 8,
    width: 140,
    height: 140,
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
