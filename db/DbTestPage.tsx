import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { addUser, FIREBASE_BASE_URL } from './firebaseApi';

export default function DbTestPage() {
  // USERS
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  // TRAVEL NOTE
  const [noteUserId, setNoteUserId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDesc, setNoteDesc] = useState('');
  const [notePhoto, setNotePhoto] = useState('');
  const [noteLoc, setNoteLoc] = useState('');
  const [noteCoord, setNoteCoord] = useState('');
  const [notes, setNotes] = useState<any[]>([]);

  // WISHLIST
  const [wishUserId, setWishUserId] = useState('');
  const [wishPlace, setWishPlace] = useState('');
  const [wishLoc, setWishLoc] = useState('');
  const [wishCoord, setWishCoord] = useState('');
  const [wishlist, setWishlist] = useState<any[]>([]);

  // CHAT
  const [chatUserId, setChatUserId] = useState('');
  const [chatRole, setChatRole] = useState('');
  const [chatText, setChatText] = useState('');
  const [chats, setChats] = useState<any[]>([]);

  // Fetch all users
  const fetchUsers = async () => {
    const res = await fetch(`${FIREBASE_BASE_URL}/users`);
    const data = await res.json();
    setUsers(data.documents ? data.documents.map((doc: any) => doc.fields) : []);
  };

  // Add user
  const handleAddUser = async () => {
    if (!username || !password || !userId) return;
    await addUser({ id: userId, username, password });
    setUsername(''); setPassword(''); setUserId('');
    fetchUsers();
  };

  // Fetch all notes
  const fetchNotes = async () => {
    const res = await fetch(`${FIREBASE_BASE_URL}/travel_note`);
    const data = await res.json();
    setNotes(data.documents ? data.documents.map((doc: any) => doc.fields) : []);
  };

  // Add note
  const handleAddNote = async () => {
    if (!noteUserId || !noteTitle || !noteDesc) return;
    const url = `${FIREBASE_BASE_URL}/travel_note`;
    const body = {
      fields: {
        user_id: { stringValue: noteUserId },
        title: { stringValue: noteTitle },
        description: { stringValue: noteDesc },
        photo_url: { stringValue: notePhoto },
        location: { stringValue: noteLoc },
        coordinate: { stringValue: noteCoord },
      },
    };
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setNoteUserId(''); setNoteTitle(''); setNoteDesc(''); setNotePhoto(''); setNoteLoc(''); setNoteCoord('');
    fetchNotes();
  };

  // Fetch all wishlist
  const fetchWishlist = async () => {
    const res = await fetch(`${FIREBASE_BASE_URL}/travel_wishlist`);
    const data = await res.json();
    setWishlist(data.documents ? data.documents.map((doc: any) => doc.fields) : []);
  };

  // Add wishlist
  const handleAddWishlist = async () => {
    if (!wishUserId || !wishPlace) return;
    const url = `${FIREBASE_BASE_URL}/travel_wishlist`;
    const body = {
      fields: {
        user_id: { stringValue: wishUserId },
        place_name: { stringValue: wishPlace },
        location: { stringValue: wishLoc },
        coordinate: { stringValue: wishCoord },
      },
    };
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setWishUserId(''); setWishPlace(''); setWishLoc(''); setWishCoord('');
    fetchWishlist();
  };

  // Fetch all chat
  const fetchChats = async () => {
    const res = await fetch(`${FIREBASE_BASE_URL}/chat`);
    const data = await res.json();
    setChats(data.documents ? data.documents.map((doc: any) => doc.fields) : []);
  };

  // Add chat
  const handleAddChat = async () => {
    if (!chatUserId || !chatRole || !chatText) return;
    const url = `${FIREBASE_BASE_URL}/chat`;
    const body = {
      fields: {
        user_id: { stringValue: chatUserId },
        role: { stringValue: chatRole },
        text: { stringValue: chatText },
      },
    };
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setChatUserId(''); setChatRole(''); setChatText('');
    fetchChats();
  };

  return (
    <ScrollView style={styles.container}>
      {/* USERS */}
      <View style={styles.section}>
        <Text style={styles.title}>Users</Text>
        <TextInput placeholder="User ID" value={userId} onChangeText={setUserId} style={styles.input} />
        <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} />
        <Button title="Add User" onPress={handleAddUser} />
        <Button title="Refresh Users" onPress={fetchUsers} />
        <Text style={styles.subtitle}>Data Users:</Text>
        {users.length === 0 && <Text style={styles.empty}>Belum ada data</Text>}
        {users.map((u, i) => (
          <Text key={i} style={styles.dataRow}>
            id: {u.id?.stringValue} | username: {u.username?.stringValue} | password: {u.password?.stringValue}
          </Text>
        ))}
      </View>
      {/* TRAVEL NOTE */}
      <View style={styles.section}>
        <Text style={styles.title}>Travel Note</Text>
        <TextInput placeholder="User ID" value={noteUserId} onChangeText={setNoteUserId} style={styles.input} />
        <TextInput placeholder="Title" value={noteTitle} onChangeText={setNoteTitle} style={styles.input} />
        <TextInput placeholder="Description" value={noteDesc} onChangeText={setNoteDesc} style={styles.input} />
        <TextInput placeholder="Photo URL" value={notePhoto} onChangeText={setNotePhoto} style={styles.input} />
        <TextInput placeholder="Location" value={noteLoc} onChangeText={setNoteLoc} style={styles.input} />
        <TextInput placeholder="Coordinate" value={noteCoord} onChangeText={setNoteCoord} style={styles.input} />
        <Button title="Add Note" onPress={handleAddNote} />
        <Button title="Refresh Notes" onPress={fetchNotes} />
        <Text style={styles.subtitle}>Data Notes:</Text>
        {notes.length === 0 && <Text style={styles.empty}>Belum ada data</Text>}
        {notes.map((n, i) => (
          <Text key={i} style={styles.dataRow}>
            user_id: {n.user_id?.stringValue} | title: {n.title?.stringValue} | desc: {n.description?.stringValue}
          </Text>
        ))}
      </View>
      {/* WISHLIST */}
      <View style={styles.section}>
        <Text style={styles.title}>Wishlist</Text>
        <TextInput placeholder="User ID" value={wishUserId} onChangeText={setWishUserId} style={styles.input} />
        <TextInput placeholder="Place Name" value={wishPlace} onChangeText={setWishPlace} style={styles.input} />
        <TextInput placeholder="Location" value={wishLoc} onChangeText={setWishLoc} style={styles.input} />
        <TextInput placeholder="Coordinate" value={wishCoord} onChangeText={setWishCoord} style={styles.input} />
        <Button title="Add Wishlist" onPress={handleAddWishlist} />
        <Button title="Refresh Wishlist" onPress={fetchWishlist} />
        <Text style={styles.subtitle}>Data Wishlist:</Text>
        {wishlist.length === 0 && <Text style={styles.empty}>Belum ada data</Text>}
        {wishlist.map((w, i) => (
          <Text key={i} style={styles.dataRow}>
            user_id: {w.user_id?.stringValue} | place: {w.place_name?.stringValue} | location: {w.location?.stringValue}
          </Text>
        ))}
      </View>
      {/* CHAT */}
      <View style={styles.section}>
        <Text style={styles.title}>Chat</Text>
        <TextInput placeholder="User ID" value={chatUserId} onChangeText={setChatUserId} style={styles.input} />
        <TextInput placeholder="Role" value={chatRole} onChangeText={setChatRole} style={styles.input} />
        <TextInput placeholder="Text" value={chatText} onChangeText={setChatText} style={styles.input} />
        <Button title="Add Chat" onPress={handleAddChat} />
        <Button title="Refresh Chat" onPress={fetchChats} />
        <Text style={styles.subtitle}>Data Chat:</Text>
        {chats.length === 0 && <Text style={styles.empty}>Belum ada data</Text>}
        {chats.map((c, i) => (
          <Text key={i} style={styles.dataRow}>
            user_id: {c.user_id?.stringValue} | role: {c.role?.stringValue} | text: {c.text?.stringValue}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8FAFC' },
  section: { marginBottom: 32, padding: 12, borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 12, backgroundColor: '#fff', shadowColor: '#1976d2', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 8, color: '#1976d2' },
  input: { borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 8, padding: 8, marginBottom: 8, backgroundColor: '#f8fafc' },
  subtitle: { fontWeight: 'bold', marginTop: 12, marginBottom: 4, color: '#1976d2' },
  empty: { fontStyle: 'italic', color: '#888', marginBottom: 8 },
  dataRow: { fontSize: 13, color: '#333', marginBottom: 2 },
});
