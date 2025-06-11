import React, { useState, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { getLocationNameFromCoords } from '../../utils/reverseGeocode';
import MapView, { Marker } from 'react-native-maps';

export default function SelectLocationModal({ visible, onClose, onSelect }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (lat: number, lon: number, address: string) => void;
}) {
  const [region, setRegion] = useState({
    latitude: -7.085097,
    longitude: 111.0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [marker, setMarker] = useState<{ lat: number; lon: number } | null>(null);
  const [search, setSearch] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Maps API Key
  const GOOGLE_MAPS_API_KEY = 'AIzaSyDoPi5NJSx5-1pDloTcGMDsQijI1RoL0BI';

  // Handler for map press (expo-maps)
  const handleMapPress = async (e: any) => {
    // expo-maps: e.nativeEvent.coordinate
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ lat: latitude, lon: longitude });
    setLoading(true);
    const addr = await getLocationNameFromCoords(latitude, longitude);
    setAddress(addr);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!search) return;
    setLoading(true);
    // Use Nominatim search API
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'travelmate-app' } });
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      setRegion({ ...region, latitude: lat, longitude: lon });
      setMarker({ lat, lon });
      const addr = await getLocationNameFromCoords(lat, lon);
      setAddress(addr);
      // Center and animate map to searched location
      if (mapRef.current) {
        (mapRef.current as any).animateToRegion({
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    }
    setLoading(false);
  };

  // Ref for MapView
  const mapRef = useRef<MapView>(null);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Pilih Lokasi</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari tempat..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={{ color: '#fff' }}>Cari</Text>
          </TouchableOpacity>
        </View>
        {/* Google Maps (react-native-maps) */}
        <MapView
          ref={mapRef}
          style={[styles.map, { height: 450 }]}
          region={region}
          onRegionChangeComplete={setRegion}
          onPress={handleMapPress}
          provider={Platform.OS === 'android' ? 'google' : undefined}
          rotateEnabled={true}
        >
          {marker && (
            <Marker coordinate={{ latitude: marker.lat, longitude: marker.lon }} />
          )}
        </MapView>
        <View style={{ marginVertical: 8 }}>
          <Text style={{ fontSize: 13, color: '#333' }}>{loading ? 'Mengambil alamat...' : address}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={{ color: '#888' }}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { opacity: marker ? 1 : 0.5 }]}
            disabled={!marker}
            onPress={() => {
              if (marker) onSelect(marker.lat, marker.lon, address);
              onClose();
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 36 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' },
  searchRow: { flexDirection: 'row', marginBottom: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginRight: 8 },
  searchButton: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  map: { width: '100%', height: 450, borderRadius: 10 },
  cancelButton: { padding: 12, borderRadius: 8, backgroundColor: '#eee', minWidth: 80, alignItems: 'center' },
  saveButton: { padding: 12, borderRadius: 8, backgroundColor: '#34a853', minWidth: 80, alignItems: 'center' },
});
