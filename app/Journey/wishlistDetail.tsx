import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getWishlistById, deleteWishlist } from '../../db/firebaseApi';

export default function WishlistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [wish, setWish] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const res = await getWishlistById(id as string);
      setWish(res);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;
  if (!wish) return <View style={styles.center}><Text>Data tidak ditemukan</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{wish.place_name}</Text>
      <View style={styles.locationBox}>
        <Text style={styles.locationLabel}>Lokasi:</Text>
        <Text style={styles.locationValue}>{wish.location}</Text>
        <Text style={styles.locationLabel}>Koordinat:</Text>
        <Text style={styles.locationValue}>{wish.coordinate}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: '/Journey/editWishlist', params: { id: wish.id } })}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#e53935' }]} onPress={async () => {
          Alert.alert('Konfirmasi', 'Hapus wishlist ini?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => {
              await deleteWishlist(wish.id);
              router.replace('/Journey/notes');
            }}
          ]);
        }}>
          <Text style={styles.actionButtonText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', paddingTop: 36 },
  title: { fontWeight: 'bold', fontSize: 22, marginBottom: 16, textAlign: 'center', color: '#1976d2' },
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
  actionButton: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 80,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
