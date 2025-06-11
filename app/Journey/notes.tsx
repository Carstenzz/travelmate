import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTravelNotesByUser } from '../../db/firebaseApi';
import WishlistSection from './WishlistSection';

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'abjad' | 'tanggal'>('tanggal');

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

  // Sort and filter notes
  let sortedNotes = [...notes];
  if (sortBy === 'abjad') {
    sortedNotes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  } else {
    // Default: tanggal terbaru di atas, asumsikan ada field created_at (string/timestamp)
    sortedNotes.sort((a, b) => {
      // Fallback: jika tidak ada created_at, urutkan dari id (Firestore id biasanya urut waktu)
      const aTime = a.created_at ? new Date(a.created_at).getTime() : (a.id || '').localeCompare(b.id || '');
      const bTime = b.created_at ? new Date(b.created_at).getTime() : (b.id || '').localeCompare(a.id || '');
      return bTime - aTime;
    });
  }
  const filteredNotes = search.trim().length === 0
    ? sortedNotes
    : sortedNotes.filter(note =>
        (note.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (note.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (note.location || '').toLowerCase().includes(search.toLowerCase())
      );

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <View style={{ flex: 1, paddingTop: 36 }}>
      <WishlistSection onAdd={() => router.push('/Journey/addWishlist')} />
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/Journey/addNote')}>
        <Text style={styles.addButtonText}>+ Tambah Note</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 8 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 8 }}
          placeholder="Cari judul, deskripsi, atau lokasi..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={{ backgroundColor: sortBy === 'tanggal' ? '#007AFF' : '#eee', padding: 8, borderRadius: 8 }}
          onPress={() => setSortBy('tanggal')}
        >
          <Text style={{ color: sortBy === 'tanggal' ? '#fff' : '#333' }}>Tanggal</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ backgroundColor: sortBy === 'abjad' ? '#007AFF' : '#eee', padding: 8, borderRadius: 8 }}
          onPress={() => setSortBy('abjad')}
        >
          <Text style={{ color: sortBy === 'abjad' ? '#fff' : '#333' }}>Abjad</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {filteredNotes.length === 0 && <Text style={{ textAlign: 'center', marginTop: 32 }}>Belum ada catatan.</Text>}
        {filteredNotes.map(note => (
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
  addButton: { backgroundColor: '#1976d2', padding: 14, alignItems: 'center', margin: 16, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#e3f2fd' },
  cardImage: { width: 220, height: 120, borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
