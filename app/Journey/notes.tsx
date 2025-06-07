import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTravelNotesByUser } from '../../db/firebaseApi';
import WishlistSection from './WishlistSection';

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Get session from AsyncStorage
      const sessionStr = await AsyncStorage.getItem('@travelmate/user_session');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      if (!session || !session.user_id) {
        setNotes([]);
        setLoading(false);
        return;
      }
      const res = await getTravelNotesByUser(session.user_id);
      // Urutkan descending by id (Firestore id is string, so sort by name or add timestamp in future)
      setNotes(res.reverse());
      setLoading(false);
    })();
  }, []);

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <View style={{ flex: 1, paddingTop: 36 }}>
      <WishlistSection onAdd={() => router.push('/Journey/addWishlist')} />
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/Journey/addNote')}>
        <Text style={styles.addButtonText}>+ Tambah Note</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {notes.length === 0 && <Text style={{ textAlign: 'center', marginTop: 32 }}>Belum ada catatan.</Text>}
        {notes.map(note => (
          <TouchableOpacity key={note.id} style={styles.card} onPress={() => router.push({ pathname: '/Journey/editNote', params: { id: note.id } })}>
            {note.photo_url ? (
              <Image source={{ uri: note.photo_url }} style={styles.cardImage} />
            ) : null}
            <Text style={styles.cardTitle}>{note.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: { backgroundColor: '#007AFF', padding: 14, alignItems: 'center', margin: 16, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', elevation: 2 },
  cardImage: { width: 220, height: 120, borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
