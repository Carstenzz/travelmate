import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserByUsername } from '../../firebaseApi';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Username dan password wajib diisi!');
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
      const user = await getUserByUsername(usernameHash);
      if (!user) {
        Alert.alert('Error', 'Username tidak ditemukan!');
        setLoading(false);
        return;
      }
      if (user.password !== passwordHash) {
        Alert.alert('Error', 'Password salah!');
        setLoading(false);
        return;
      }
      await AsyncStorage.setItem('@travelmate/user_session', JSON.stringify({ user_id: user.id }));
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', 'Gagal login.');
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Login</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={{ borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 8 }}
      />
      <Button title={loading ? 'Loading...' : 'Login'} onPress={handleLogin} disabled={loading} />
      <Text style={{ marginTop: 16 }}>
        Belum punya akun?{' '}
        <Text style={{ color: 'blue' }} onPress={() => router.replace('/auth/register')}>
          Register
        </Text>
      </Text>
    </View>
  );
}
