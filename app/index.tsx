import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions, AppState, TouchableOpacity } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

// Ganti spritesheet idle ke mate_idle_simplified_spreadsheet.png dan frame idle ke 14
const mateIdleSheet = require('../assets/mate_idle_simplified_spreadsheet.png');
const mateSpeakSheet = require('../assets/mate_speak_spreadsheet_scaled_2x_pngcrushed (1).png');
const mateSleepSheet = require('../assets/mate_sleep_spreadsheet_scaled_2x_pngcrushed (1).png');
const mateWakeSheet = require('../assets/mate_wake_spreadsheet_scaled_2x_pngcrushed (1).png');

const SPRITE_FRAMES = {
  idle: 14, // update jumlah frame idle
  speak: 2,
  sleep: 14,
  wake: 10,
};

// Ukuran frame (asumsi: semua frame persegi, 1 baris)
const { width } = Dimensions.get('window');
const SPRITE_WIDTH = width * 1; // lebar frame yang ingin ditampilkan
const SPRITE_HEIGHT = width * 1; // tinggi frame

const SPEAK_MESSAGES = [
  'Hai, mau ngapain hari ini?',
  'Jalan-jalan enak nih kayaknya!',
  'Ada rencana kemana hari ini?'
];

const NOTIF_MESSAGES = [
  'Kemana aja? Mate pengen jalan-jalan ni',
  'Mate gabut, yok jalan-jalan bareng',
  'Udah lama nggak dibuka, mate bosen ni',
];

export default function HomeScreen() {
  const [mateState, setMateState] = useState<'idle' | 'speak' | 'sleep' | 'wake'>('idle');
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleText, setBubbleText] = useState('');
  const [isSleeping, setIsSleeping] = useState(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const speakTimer = useRef<NodeJS.Timeout | null>(null);
  const wakeTimer = useRef<NodeJS.Timeout | null>(null);
  const [gyroSub, setGyroSub] = useState<any>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const animTimer = useRef<NodeJS.Timeout | null>(null);
  const notifTimer = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Helper: reset all timers
  const clearAllTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (speakTimer.current) clearTimeout(speakTimer.current);
    if (wakeTimer.current) clearTimeout(wakeTimer.current);
  };

  // On mount: schedule speak, then sleep
  useEffect(() => {
    // Speak after 2s
    speakTimer.current = setTimeout(() => {
      setMateState('speak');
      setBubbleText(SPEAK_MESSAGES[Math.floor(Math.random() * SPEAK_MESSAGES.length)]);
      setBubbleVisible(true);
      // After 3.5s, back to idle
      speakTimer.current = setTimeout(() => {
        setMateState('idle');
        setBubbleVisible(false);
        // After 3.5s + 3.5s = 7s, sleep
        idleTimer.current = setTimeout(() => {
          setMateState('sleep');
          setIsSleeping(true);
        }, 3500);
      }, 3500);
    }, 2000);
    return () => {
      clearAllTimers();
      if (gyroSub) gyroSub.remove();
    };
    // eslint-disable-next-line
  }, []);

  // Gyro: shake to wake
  useEffect(() => {
    if (mateState === 'sleep') {
      let last = { x: 0, y: 0, z: 0 };
      let shakeCount = 0;
      const threshold = 7; // lebih tinggi, harus benar-benar digoyang
      const sub = Gyroscope.addListener((data: { x: number; y: number; z: number }) => {
        const dx = Math.abs(data.x - last.x);
        const dy = Math.abs(data.y - last.y);
        const dz = Math.abs(data.z - last.z);
        if (dx > threshold || dy > threshold || dz > threshold) {
          shakeCount++;
        } else {
          shakeCount = 0;
        }
        last = data;
        if (shakeCount > 2) {
          setMateState('wake');
          setIsSleeping(false);
          setBubbleVisible(false);
          if (sub) sub.remove();
          // After 2s, back to idle
          wakeTimer.current = setTimeout(() => {
            setMateState('idle');
            // After 7s idle, sleep lagi
            idleTimer.current = setTimeout(() => {
              setMateState('sleep');
              setIsSleeping(true);
            }, 7000);
          }, 2000);
        }
      });
      setGyroSub(sub);
      return () => { if (sub) sub.remove(); };
    }
    // eslint-disable-next-line
  }, [mateState]);

  // Animasi frame loop
  useEffect(() => {
    let frameCount = SPRITE_FRAMES[mateState];
    let interval = 200; // default 10 fps
    if (mateState === 'speak') interval = 350; // biar speak lebih lambat
    if (mateState === 'wake') interval = 160; // wake lebih cepat
    if (mateState === 'sleep') interval = 120;
    if (animTimer.current) clearInterval(animTimer.current);
    setFrameIdx(0);
    if (mateState === 'wake') {
      // Hanya 1x perulangan, lalu tetap di frame terakhir
      let idx = 0;
      animTimer.current = setInterval(() => {
        idx++;
        if (idx < frameCount) {
          setFrameIdx(idx);
        } else {
          setFrameIdx(frameCount - 1);
          if (animTimer.current) clearInterval(animTimer.current);
        }
      }, interval);
    } else {
      animTimer.current = setInterval(() => {
        setFrameIdx((prev) => (prev + 1) % frameCount);
      }, interval);
    }
    return () => { if (animTimer.current) clearInterval(animTimer.current); };
  }, [mateState]);

  // Pilih spritesheet sesuai state
  let mateSheet = mateIdleSheet;
  let frameCount = SPRITE_FRAMES.idle;
  if (mateState === 'speak') { mateSheet = mateSpeakSheet; frameCount = SPRITE_FRAMES.speak; }
  else if (mateState === 'sleep') { mateSheet = mateSleepSheet; frameCount = SPRITE_FRAMES.sleep; }
  else if (mateState === 'wake') { mateSheet = mateWakeSheet; frameCount = SPRITE_FRAMES.wake; }

  // Ukuran frame besar, penuh secara vertikal (misal 60% tinggi layar)
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  const BIG_SPRITE_HEIGHT = screenHeight * 0.6;
  const BIG_SPRITE_WIDTH = BIG_SPRITE_HEIGHT; // tetap square agar pixel art tidak gepeng

  useEffect(() => {
    // Request permission on mount
    Notifications.requestPermissionsAsync();

    // AppState listener untuk notifikasi saat app background
    const handleAppStateChange = (nextState: string) => {
      if (nextState === 'background' || nextState === 'inactive') {
        notifTimer.current = setTimeout(() => {
          console.log('Scheduling notification...');
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'TravelMate',
              body: NOTIF_MESSAGES[Math.floor(Math.random() * NOTIF_MESSAGES.length)],
            },
            trigger: null,
          });
        }, 5000);
      } else if (nextState === 'active') {
        if (notifTimer.current) clearTimeout(notifTimer.current);
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      if (notifTimer.current) clearTimeout(notifTimer.current);
      sub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/chat')}
          style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: BIG_SPRITE_WIDTH, height: BIG_SPRITE_HEIGHT }}
        >
          <View style={{ width: BIG_SPRITE_WIDTH, height: BIG_SPRITE_HEIGHT, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={mateSheet}
              style={{
                width: BIG_SPRITE_WIDTH * frameCount,
                height: BIG_SPRITE_HEIGHT,
                transform: [{ translateX: -frameIdx * BIG_SPRITE_WIDTH }],
                position: 'absolute',
                left: 0,
                top: 0,
              }}
              resizeMode="stretch"
            />
          </View>
          {bubbleVisible && (
            <View style={[
              styles.bubble,
              {
                left: '65%',
                top: 70, // bisa diubah sesuai tinggi bubble
                transform: [{ translateX: -BIG_SPRITE_WIDTH / 2 }],
                minWidth: BIG_SPRITE_WIDTH * 0.7,
                maxWidth: BIG_SPRITE_WIDTH * 0.95,
              },
            ]}>
              <Text style={styles.bubbleText}>{bubbleText}</Text>
            </View>
          )}
        </TouchableOpacity>
        {/* <Text style={{ marginTop: 24, fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Welcome to TravelMate!</Text> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mateImg: {
    width: width * 0.5,
    height: width * 0.5,
    resizeMode: 'contain',
  },
  bubble: {
    position: 'absolute',
    top: -60,
    left: '50%',
    transform: [{ translateX: -width * 0.2 }],
    minWidth: width * 0.4,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e3f2fd',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  bubbleText: {
    fontSize: 16,
    color: '#1976d2',
    textAlign: 'center',
  },
});
