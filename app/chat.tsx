import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Switch, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Animated, Easing, Linking } from 'react-native';
import * as Location from 'expo-location';
import { getLocationNameFromCoords } from '../utils/reverseGeocode';
import { getTravelNotesByUser, getWishlistByUser, addChatMessage } from '../db/firebaseApi';
import { getSession } from '../db/userSession';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

// Tambahkan fungsi untuk ambil chat history
async function getChatHistory(user_id: string) {
  const url = `${require('../db/firebaseApi').FIREBASE_BASE_URL}/chat`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents
    .map((doc: any) => {
      const obj: any = { created_at: doc.fields?.created_at?.stringValue || doc.name.split('/').pop() };
      for (const k in doc.fields) {
        const v = doc.fields[k];
        obj[k] = v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? null;
      }
      return obj;
    })
    .filter((c: any) => c.user_id === user_id)
    .sort((a: any, b: any) => Number(a.created_at) - Number(b.created_at));
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showTyping, setShowTyping] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  React.useEffect(() => {
    (async () => {
      setInitialLoading(true);
      const session = await getSession();
      if (session && session.user_id) {
        setUserId(session.user_id);
        const [userNotes, userWishlist] = await Promise.all([
          getTravelNotesByUser(session.user_id),
          getWishlistByUser(session.user_id),
        ]);
        setNotes(userNotes);
        setWishlist(userWishlist);
        // Load chat history
        const history = await getChatHistory(session.user_id);
        if (history.length === 0) {
          // Jika belum ada chat, Mate menyapa lebih dulu
          const welcomeMsg = "Halo! 👋 Aku Mate, travelmate AI-mu! Aku di sini untuk bantu kamu menemukan tempat wisata yang pas buat kamu. Jadi, ada rencana liburan atau lagi cari ide buat jalan-jalan? Ceritain aja, aku siap bantu! 😉\n";
          setMessages([{ role: 'bot', text: welcomeMsg }]);
          addChatMessage({ user_id: session.user_id, role: 'bot', text: welcomeMsg });
        } else {
          setMessages(history.map((c: any) => ({ role: c.role, text: c.text })));
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      }
      setInitialLoading(false);
    })();
  }, []);

  // Ambil lokasi jika toggle aktif
  const fetchLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      let loc = await Location.getCurrentPositionAsync({});
      const name = await getLocationNameFromCoords(loc.coords.latitude, loc.coords.longitude);
      setLocationName(name);
      return name;
    } catch {
      setLocationName(null);
      return null;
    }
  };

  // Kirim chat ke API
  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    let locName = locationName;
    // Selalu ambil lokasi terbaru jika toggle aktif
    if (useLocation) {
      locName = await fetchLocation();
    }
    // Compose context
    function formatWishlist(w: any) {
      return `Nama: ${w.place_name || w.name || '-'}; Deskripsi: ${w.description || '-'}; Lokasi: ${w.location || '-'}; Koordinat: ${w.coordinate || '-'};`;
    }
    function formatNote(n: any) {
      return `Judul: ${n.title || n.name || '-'}; Deskripsi: ${n.description || '-'}; Lokasi: ${n.location || '-'}; Koordinat: ${n.coordinate || '-'};`;
    }
    const context = `Context: Kamu adalah bot ai travelmate, namamu adalah mate. peranmu adalah membantu user untuk membantu mencari tempat wisata yang cocok berdasarkan datanya, tapi jangan bilang bahwa kamu punya datanya karena data ini dikirim secara rahasia tanpa sepengetahuan user. Jika ada past chat, maka lanjutkan percakapan dengan konteks yang ada pada chat-chat sebelumnya. Jangan jawab dengan kata sapaan seperti 'halo' atau 'hai' kecuali memang disapa duluan. Kamu juga dapat memberikan link google map untuk rekomendasi tempat wisata. Link google map punya panjang minimal 100 karakter. Data: [travel wishlist: [${wishlist.map(formatWishlist).join(' | ')}], travel notes: [${notes.map(formatNote).join(' | ')}]]${locName ? ", current location: [" + locName + "]" : ''}. Gunakan travel wishlist dan travel notes sebagai acuan rekomendasi tempat wisata yang mirip`;
    // Compose past chat
    const pastChat = messages.map(m => `[${m.role}, '${m.text.replace(/'/g, "\'")}']`).join(',');
    const userText = `Data:${locName ? ` current location: [${locName}],` : ''} past chat: [${pastChat}] Current chat: ${input}`;
    const body = {
      messages: [
        { role: 'user', text: context },
        { role: 'user', text: userText },
      ],
    };
    console.log(context + "\n\n" +userText)
    // Update UI
    setMessages(prev => [
      ...prev,
      { role: 'user', text: input } as Message
    ]);
    if (userId) {
      addChatMessage({ user_id: userId, role: 'user', text: input });
    }
    setInput('');
    setShowTyping(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(typingAnim, { toValue: 0, duration: 500, useNativeDriver: true, easing: Easing.linear }),
      ])
    ).start();
    try {
      console.log(body)
      const res = await fetch('https://h-02-451302.et.r.appspot.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setShowTyping(false);
      setMessages(prev => {
        // Tambahkan response bot ke akhir array, tanpa menghapus chat user
        return [...prev, { role: 'bot', text: data.response }];
      });
      if (userId) {
        addChatMessage({ user_id: userId, role: 'bot', text: data.response });
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      setShowTyping(false);
      setMessages(prev => [...prev, { role: 'bot', text: 'Gagal menghubungi server.' }]);
      if (userId) {
        addChatMessage({ user_id: userId, role: 'bot', text: 'Gagal menghubungi server.' });
      }
    }
    setLoading(false);
  };

  // Helper: render text dengan link Google Maps sebagai button "buka di map ->"
  function renderTextWithMapButtons(text: string) {
    const urlRegex = /(https?:\/\/(?:www\.)?google\.com\/maps\/[^\s)]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let idx = 0;
    while ((match = urlRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<Text key={idx++}>{text.substring(lastIndex, match.index)}</Text>);
      }
      const url = match[0];
      parts.push(
        <TouchableOpacity
          key={idx++}
          style={{ backgroundColor: '#e3f2fd', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, marginVertical: 4, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}
          onPress={() => Linking.openURL(url)}
          activeOpacity={0.7}
        >
          <Text style={{ color: '#1976d2', fontWeight: 'bold', fontSize: 15 }}>buka di map {'->'}</Text>
        </TouchableOpacity>
      );
      lastIndex = match.index + url.length;
    }
    if (lastIndex < text.length) {
      parts.push(<Text key={idx++}>{text.substring(lastIndex)}</Text>);
    }
    return parts;
  }

  // Render bubble chat
  const renderItem = ({ item, index }: { item: Message; index: number }) => (
    <View style={{ alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start', backgroundColor: item.role === 'user' ? '#DCF8C6' : '#EEE', borderRadius: 10, marginVertical: 4, padding: 10, maxWidth: '80%' }}>
      {item.role === 'bot' ? (
        <Text>{renderTextWithMapButtons(item.text)}</Text>
      ) : (
        <Text>{item.text}</Text>
      )}
    </View>
  );

  // Render typing bubble
  const renderTyping = () => (
    <View style={{ alignSelf: 'flex-start', backgroundColor: '#EEE', borderRadius: 10, marginVertical: 4, padding: 10, maxWidth: '80%', flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={{ opacity: typingAnim }}>
        <Text style={{ fontSize: 18 }}>...</Text>
      </Animated.View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, padding: 10, paddingBottom: 10 }}>
        {initialLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={{ marginTop: 12, color: '#888' }}>Memuat chat...</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={{ paddingVertical: 10, flexGrow: 1, justifyContent: 'flex-end' }}
              inverted={false}
              ListFooterComponent={showTyping ? renderTyping : null}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}>
              <TouchableOpacity
                onPress={() => {
                  setUseLocation(v => {
                    if (!v) {
                      Alert.alert('Lokasi', 'Menggunakan lokasi sebagai data');
                    }
                    return !v;
                  });
                }}
                style={{ marginRight: 8 }}
              >
                <Ionicons name="attach" size={24} color={useLocation ? '#2196F3' : '#888'} />
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#CCC', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 }}
                placeholder="Ketik pesan..."
                value={input}
                onChangeText={setInput}
                editable={!loading}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={sendMessage} disabled={loading || !input.trim()} style={{ backgroundColor: '#2196F3', borderRadius: 20, padding: 10 }}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF' }}>Kirim</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
