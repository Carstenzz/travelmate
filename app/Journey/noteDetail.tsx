import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { getTravelNoteById, deleteTravelNote } from '../../db/firebaseApi';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const res = await getTravelNoteById(id as string);
      setNote(res);
    })();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert('Hapus Catatan', 'Yakin ingin menghapus catatan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive', onPress: async () => {
          await deleteTravelNote(note.id);
          router.replace('/Journey/notes');
        }
      }
    ]);
  };

  if (!note) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {note.photo_url ? (
        <Image source={{ uri: note.photo_url }} style={styles.image} />
      ) : null}
      <Text style={styles.title}>{note.title}</Text>
      <Text style={styles.label}>Lokasi:</Text>
      <Text style={styles.value}>{note.location || '-'}</Text>
      <Text style={styles.label}>Koordinat:</Text>
      <Text style={styles.value}>{note.coordinate || '-'}</Text>
      <Text style={styles.label}>Deskripsi:</Text>
      <Text style={styles.value}>{note.description}</Text>
      <View style={{ flexDirection: 'row', marginTop: 24, gap: 16 }}>
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/editNote', params: { id: note.id } })}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#e74c3c' }]} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  image: { width: 240, height: 180, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  label: { fontWeight: 'bold', marginTop: 12 },
  value: { fontSize: 16, marginBottom: 4 },
  button: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
