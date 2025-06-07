import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, TouchableOpacity, ScrollView } from 'react-native';

export default function JalanJalanScreen() {
  const [uang, setUang] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<{ uangConverted: number; jamLokal: string; currency: string } | null>(null);
  const [mateComment, setMateComment] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Helper: fetch location info (currency, timezone) from Nominatim & GeoNames
  const fetchLocationInfo = async (place: string) => {
    // 1. Get lat/lon from Nominatim
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`);
    const nomData = await nomRes.json();
    if (!nomData[0]) throw new Error('Lokasi tidak ditemukan');
    const { lat, lon, display_name } = nomData[0];
    // 2. Get timezone from GeoNames
    const geoRes = await fetch(`http://api.geonames.org/timezoneJSON?lat=${lat}&lng=${lon}&username=demo`); // ganti 'demo' dengan username geonames jika punya
    const geoData = await geoRes.json();
    // 3. Get currency from restcountries
    const countryRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
    const countryData = await countryRes.json();
    const countryCode = countryData.address?.country_code?.toUpperCase();
    let currency = 'USD';
    if (countryCode) {
      const restRes = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
      const restData = await restRes.json();
      currency = restData[0]?.currencies ? Object.keys(restData[0].currencies)[0] : 'USD';
    }
    return { lat, lon, timezone: geoData.timezoneId, currency, display_name };
  };

  // Helper: fetch currency conversion
  const fetchCurrency = async (amount: string, to: string) => {
    const kursRes = await fetch(`https://api.exchangerate.host/convert?from=IDR&to=${to}&amount=${amount}`);
    const kursData = await kursRes.json();
    return kursData.result;
  };

  // Helper: fetch time in timezone
  const fetchTime = async (timezone: string) => {
    const timeRes = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`);
    const timeData = await timeRes.json();
    if (timeData.datetime) {
      const date = new Date(timeData.datetime);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return '-';
  };

  const handleSubmit = async () => {
    if (!uang || isNaN(Number(uang)) || !tujuan) return;
    setLoading(true);
    setHasil(null);
    setMateComment('');
    try {
      const loc = await fetchLocationInfo(tujuan);
      const uangConverted = await fetchCurrency(uang, loc.currency);
      const jamLokal = await fetchTime(loc.timezone);
      setHasil({ uangConverted, jamLokal, currency: loc.currency });
      // 3. Fetch komentar mate
      const chatRes = await fetch('https://h-02-451302.et.r.appspot.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              text: 'Context: Kamu adalah bot ai travelmate, namamu adalah mate. peranmu adalah membantu user untuk membantu mencari tempat wisata. Khusus untuk kondisi ini, kamu akan memberikan komentar tentang sejumlah uang dalam suatu wilayah bisa untuk apa aja, boleh sambil diselingi candaan. Jawab dengan jawaban singkat saja, kurang dari 15 kata. Jangan ucapkan kata salam seperti halo dan hai'
            },
            {
              role: 'user',
              text: `Data: [uang: $${uangConverted?.toFixed(2)}, tempat: ${tujuan.toLowerCase()}]`
            }
          ]
        })
      });
      const chatData = await chatRes.json();
      setMateComment(chatData.response);
    } catch (e) {
      setHasil(null);
      setMateComment('Gagal mengambil data.');
      console.log(e);
    }
    setLoading(false);
  };

  // Optional: simple suggestion (autocomplete)
  const handleTujuanChange = (text: string) => {
    setTujuan(text);
    if (text.length > 2) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}`)
        .then(res => res.json())
        .then(data => setSuggestions(data.map((d: any) => d.display_name)))
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Jalan-jalan Page</Text>
        <Text style={styles.label}>Mau pergi ke mana?</Text>
        <TextInput
          style={styles.input}
          value={tujuan}
          onChangeText={handleTujuanChange}
          placeholder="Ketik tujuan (misal: New York, Tokyo, dll)"
        />
        {suggestions.length > 0 && (
          <ScrollView style={{ maxHeight: 100, width: 200, backgroundColor: '#fafafa', borderRadius: 8, marginBottom: 8 }}>
            {suggestions.map((s, i) => (
              <TouchableOpacity key={i} onPress={() => { setTujuan(s); setSuggestions([]); }}>
                <Text style={{ padding: 8 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        <Text style={styles.label}>Punya uang berapa (Rp)?</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={uang}
          onChangeText={setUang}
          placeholder="Masukkan jumlah rupiah"
        />
        <Button title="Cek!" onPress={handleSubmit} disabled={loading} />
        {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
        {hasil && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Uangmu setara dengan <Text style={{ fontWeight: 'bold' }}>{hasil.currency} {hasil.uangConverted?.toFixed(2)}</Text></Text>
            <Text style={styles.resultText}>Waktu di tujuan: <Text style={{ fontWeight: 'bold' }}>{hasil.jamLokal}</Text></Text>
          </View>
        )}
        {mateComment ? (
          <View style={styles.mateBox}>
            <Image source={require('../assets/icon.png')} style={styles.mateIcon} />
            <Text style={styles.mateText}>{mateComment}</Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 16, marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: 200, marginBottom: 16 },
  dropdownContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dropdownItem: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginHorizontal: 4, fontSize: 16 },
  selectedDropdown: { backgroundColor: '#e0e0e0', borderColor: '#007AFF' },
  resultBox: { marginTop: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center' },
  resultText: { fontSize: 16, marginBottom: 8 },
  mateBox: { flexDirection: 'row', alignItems: 'center', marginTop: 32, backgroundColor: '#e3f2fd', borderRadius: 16, padding: 12 },
  mateIcon: { width: 40, height: 40, marginRight: 12 },
  mateText: { fontSize: 16, fontStyle: 'italic', flexShrink: 1 },
});
