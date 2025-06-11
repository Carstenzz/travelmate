import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, TouchableOpacity, Dimensions } from 'react-native';
import tzlookup from 'tz-lookup';
import SelectLocationModal from './Journey/modal.selectLocation';

const mateIdleSheet = require('../assets/mate_idle_simplified_spreadsheet.png');
const SPRITE_FRAMES = 14; // idle frame count
const { width: screenWidth } = Dimensions.get('window');
const SPRITE_SIZE = 40; // ukuran icon mate di bubble (square)

export default function JalanJalanScreen() {
  const [uang, setUang] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<{ uangConverted: number; jamLokal: string; currency: string } | null>(null);
  const [mateComment, setMateComment] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLatLon, setSelectedLatLon] = useState<{ lat: number; lon: number; address: string } | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const animTimer = useRef<NodeJS.Timeout | null>(null);

  // Animasi frame loop mate idle
  useEffect(() => {
    if (mateComment) {
      setFrameIdx(0);
      if (animTimer.current) clearInterval(animTimer.current);
      animTimer.current = setInterval(() => {
        setFrameIdx((prev) => (prev + 1) % SPRITE_FRAMES);
      }, 180); // ~6 fps agar smooth tapi tidak terlalu cepat
    } else {
      if (animTimer.current) clearInterval(animTimer.current);
    }
    return () => { if (animTimer.current) clearInterval(animTimer.current); };
  }, [mateComment]);

  // Helper: fetch location info (currency, timezone) from Nominatim & GeoNames
  const fetchLocationInfo = async (place: string, lat?: number, lon?: number) => {
    // 1. Get lat/lon from Nominatim, or use provided lat/lon
    let latVal = lat, lonVal = lon, display_name = place;
    if (lat == null || lon == null) {
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`, {
        headers: {
          'User-Agent': 'travelmate-app/1.0 (your@email.com)',
          'Accept-Language': 'en',
        },
      });
      if (!nomRes.ok) {
        const text = await nomRes.text();
        throw new Error('Nominatim error: ' + nomRes.status + ' ' + text);
      }
      const nomData = await nomRes.json();
      if (!nomData[0]) throw new Error('Lokasi tidak ditemukan');
      latVal = nomData[0].lat;
      lonVal = nomData[0].lon;
      display_name = nomData[0].display_name;
    }
    // 2. Get timezone from tz-lookup
    const timezone = tzlookup(Number(latVal), Number(lonVal));
    // 3. Get currency from restcountries
    const countryRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latVal}&lon=${lonVal}`, {
      headers: {
        'User-Agent': 'travelmate-app/1.0 (your@email.com)',
        'Accept-Language': 'en',
      },
    });
    const countryData = await countryRes.json();
    const countryCode = countryData.address?.country_code?.toUpperCase();
    let currency = 'USD';
    if (countryCode) {
      const restRes = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`, {
        headers: {
          'User-Agent': 'travelmate-app/1.0 (your@email.com)',
          'Accept-Language': 'en',
        },
      });
      const restData = await restRes.json();
      currency = restData[0]?.currencies ? Object.keys(restData[0].currencies)[0] : 'USD';
    }
    return { lat: latVal, lon: lonVal, timezone, currency, display_name };
  };

  // Helper: fetch currency conversion
  const fetchCurrency = async (amount: string, to: string) => {
    if (to === 'IDR') return Number(amount); // Jika tujuan IDR, return langsung
    try {
      console.log(to + " - " + amount)
      const kursRes = await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=IDR&to=${to}`, {
        headers: {
          'User-Agent': 'travelmate-app/1.0 (your@email.com)',
          'Accept-Language': 'en',
        },
      });
      const kursData = await kursRes.json();
      console.log("kursdata : ", kursData["rates"][to]);
      if (kursData && kursData["rates"][to]) return kursData["rates"][to];
    } catch (e) {
      console.log('fetch kurs error', e);
    }
    // fallback static rates
    const fallbackRates: Record<string, number> = {
      USD: 16000,
      JPY: 110,
      EUR: 17000,
      GBP: 19000,
      AUD: 10500,
    };
    const rate = fallbackRates[to] || 16000;
    return Number(amount) / rate;
  };

  // Helper: fetch time in timezone
  const fetchTime = async (timezone: string) => {
    // Ambil waktu UTC sekarang
    const now = new Date();
    // Format waktu lokal tujuan
    return now.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
  };

  const handleSubmit = async () => {
    if ((!uang || isNaN(Number(uang))) || (!tujuan && !selectedLatLon)) return;
    setLoading(true);
    setHasil(null);
    setMateComment('');
    try {
      let loc;
      if (selectedLatLon) {
        loc = await fetchLocationInfo(selectedLatLon.address, selectedLatLon.lat, selectedLatLon.lon);
      } else {
        loc = await fetchLocationInfo(tujuan);
      }
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
              text: 'Context: Kamu adalah bot ai travelmate, namamu adalah mate. peranmu adalah membantu user untuk membantu mencari tempat wisata. Khusus untuk kondisi ini, kamu akan memberikan komentar tentang sejumlah uang untuk jalan-jalan ke suatu wilayah dari indonesia bisa atau tidak, dan jika bisa pakai apa dan dapat apa disana, boleh sambil diselingi candaan. Jawab dengan jawaban singkat saja, kurang dari 20 kata. Jangan ucapkan kata salam seperti halo dan hai'
            },
            {
              role: 'user',
              text: `Data: [uang: currency: ${loc.currency}, ${uangConverted?.toFixed(2)}, tempat: ${loc.display_name?.toLowerCase()}]`
            }
          ]
        })
      });
      const chatData = await chatRes.json();
      setMateComment(chatData.response);
    } catch (e) {
      setHasil(null);
      setMateComment('Gagal mengambil data.' + e);
    }
    setLoading(false);
  };

  // Optional: simple suggestion (autocomplete)
  const handleTujuanChange = (text: string) => {
    setTujuan(text);
    // autocomplete/rec engine is disabled
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Jalan-jalan</Text>
        <Text style={styles.label}>Mau pergi ke mana?</Text>
        
        <View style={{ flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TextInput
            style={{borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: 200}}
            value={tujuan}
            onChangeText={handleTujuanChange}
            placeholder="Ketik tujuan (misal: New York, Tokyo, dll)"
          />
          <Text>Atau</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8 }}
            onPress={() => setModalVisible(true)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Pilih di Map</Text>
          </TouchableOpacity>
        </View>
        <SelectLocationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={(lat, lon, address) => {
            setSelectedLatLon({ lat, lon, address });
            setTujuan(address);
            setModalVisible(false);
          }}
        />
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
            <View style={{ width: SPRITE_SIZE, height: SPRITE_SIZE, overflow: 'hidden', marginRight: 12 }}>
              <Image
                source={mateIdleSheet}
                style={{
                  width: SPRITE_SIZE * SPRITE_FRAMES,
                  height: SPRITE_SIZE,
                  transform: [{ translateX: -frameIdx * SPRITE_SIZE }],
                  position: 'absolute',
                  left: 0,
                  top: 0,
                }}
                resizeMode="stretch"
              />
            </View>
            <Text style={styles.mateText}>{mateComment}</Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1976d2' },
  label: { fontSize: 16, marginTop: 30, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e3f2fd', borderRadius: 8, padding: 8, width: 200, marginBottom: 16, backgroundColor: '#f8fafc' },
  dropdownContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  dropdownItem: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e3f2fd', marginHorizontal: 4, fontSize: 16, backgroundColor: '#fff' },
  selectedDropdown: { backgroundColor: '#e3f2fd', borderColor: '#1976d2' },
  resultBox: { marginTop: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center' },
  resultText: { fontSize: 16, marginBottom: 8 },
  mateBox: { flexDirection: 'row', alignItems: 'center', marginTop: 32, backgroundColor: '#e3f2fd', borderRadius: 16, padding: 12 },
  mateIcon: { width: 40, height: 40, marginRight: 12 },
  mateText: { fontSize: 16, fontStyle: 'italic', flexShrink: 1, color: '#1976d2' },
});
