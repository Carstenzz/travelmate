import { View, Text } from 'react-native';
import DbTestPage from 'db/DbTestPage';

export default function HomeScreen() {
  return(<DbTestPage/>)

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Welcome to TravelMate!</Text>
    </View>
  );
}
