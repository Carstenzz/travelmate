import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { insertUser, checkUserExists, getUserByUsername } from '../../firebaseApi';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert('Error', 'Semua field wajib diisi!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password dan konfirmasi password tidak sama!');
      return;
    }
    setLoading(true);
    try {
      // Hash username
      const usernameHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        username
      );
      // Hash password
      const passwordHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        password
      );
      const exists = await checkUserExists(usernameHash);
      if (exists) {
        Alert.alert('Error', 'Username sudah terdaftar!');
        setLoading(false);
        return;
      }
      await insertUser(usernameHash, passwordHash);
      // Ambil user yang baru saja dibuat
      const user = await getUserByUsername(usernameHash);
      if (user) {
        await AsyncStorage.setItem('@travelmate/user_session', JSON.stringify({ user_id: user.id }));
      }
      Alert.alert('Sukses', 'Registrasi berhasil!', [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Gagal registrasi.');
      console.log(e)
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Register</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={[{ borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 8 }, { color: '#000' }]}
        placeholderTextColor="#888"
        />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={[{ borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 8 }, { color: '#000' }]}
        placeholderTextColor="#888"
        />
      <TextInput
        placeholder="Konfirmasi Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={[{ borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 8 }, { color: '#000' }]}
        placeholderTextColor="#888"
        />
      <Button title={loading ? 'Loading...' : 'Register'} onPress={handleRegister} disabled={loading} />
      <Text style={{ marginTop: 16 }}>
        Sudah punya akun?{' '}
        <Text style={{ color: 'blue' }} onPress={() => router.replace('/auth/login')}>
          Login
        </Text>
      </Text>
    </View>
  );
}
