import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWishlistByUser } from '../../db/firebaseApi';

export default function WishlistSection({ onAdd }: { onAdd: () => void }) {
  const router = useRouter();
  const [wishlistData, setWishlistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const sessionStr = await AsyncStorage.getItem('@travelmate/user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      if (!session || !session.user_id) {
        setWishlistData([]);
        setLoading(false);
        return;
      }
      const res = await getWishlistByUser(session.user_id);
      setWishlistData(res.reverse());
      setLoading(false);
    })();
  }, []);

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={styles.sectionTitle}>Travel Wishlist</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
          <Text style={styles.addButtonText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text style={{ textAlign: 'center', marginVertical: 16 }}>Loading...</Text>
      ) : wishlistData.length === 0 ? (
        <Text style={{ textAlign: 'center', marginVertical: 16 }}>Belum ada wishlist.</Text>
      ) : (
        wishlistData.map(wish => (
          <TouchableOpacity key={wish.id} style={styles.wishCard} onPress={() => router.push({ pathname: '/Journey/wishlistDetail', params: { id: wish.id } })}>
            <Text style={styles.wishName}>{wish.place_name}</Text>
            <Text style={styles.wishLocation}>{wish.location}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: 'bold', fontSize: 18 },
  addButton: { backgroundColor: '#1976d2', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  wishCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, borderWidth: 1, borderColor: '#e3f2fd' },
  wishName: { fontWeight: 'bold', fontSize: 16, color: '#1976d2' },
  wishLocation: { color: '#555', fontSize: 13 },
});
