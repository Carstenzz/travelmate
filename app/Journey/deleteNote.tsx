import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { deleteTravelNote } from '../../db/firebaseApi';
import { View, Text, StyleSheet } from 'react-native';

export default function DeleteNoteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!id) return;
      await deleteTravelNote(id as string);
      router.replace('/Journey/notes');
    })();
  }, [id]);

  return (
    <View style={styles.center}>
      <Text>Menghapus catatan...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
