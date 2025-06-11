import { Slot, useRouter, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { getSession } from '../db/userSession';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import "../global.css"

const NAV_ITEMS = [
  { name: 'Notes', route: '/Journey/notes', icon: (color: string) => <MaterialIcons name="notes" size={24} color={color} /> },
  { name: 'Chat', route: '/chat', icon: (color: string) => <MaterialCommunityIcons name="chat" size={24} color={color} /> },
  { name: 'Home', route: '/', icon: (color: string) => <MaterialIcons name="home" size={28} color={color} /> },
  { name: 'Jalan-jalan', route: '/jalan-jalan', icon: (color: string) => <FontAwesome5 name="walking" size={22} color={color} /> },
  { name: 'Profile', route: '/profile', icon: (color: string) => <MaterialIcons name="person" size={24} color={color} /> },
];

function BottomNav({
  current,
  navigate,
}: {
  current: string;
  navigate: (route: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e3f2fd', paddingVertical: 8, paddingBottom: 32, elevation: 8 }}>
      {NAV_ITEMS.map(item => (
        <TouchableOpacity
          key={item.route}
          onPress={() => navigate(item.route)}
          style={{ alignItems: 'center', flex: 1 }}
        >
          {item.icon(current === item.route ? '#1976d2' : '#b0bec5')}
          <Text style={{ color: current === item.route ? '#1976d2' : '#b0bec5', fontSize: 12, marginTop: 2 }}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function Layout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (
        !session &&
        pathname !== '/auth/login' &&
        pathname !== '/auth/register'
      ) {
        router.replace('/auth/login');
      }
      setLoading(false);
    })();
  }, [pathname]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Hide navbar on login/register
  if (pathname === '/auth/login' || pathname === '/auth/register') {
    return <Slot />;
  }

  // Render page with custom bottom navbar
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <BottomNav current={pathname} navigate={router.replace} />
    </View>
  );
}
