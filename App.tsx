import { StatusBar } from 'expo-status-bar';
import DbTestPage from 'firebase/DbTestPage';

import './global.css';

export default function App() {
  return (
    <>
      <DbTestPage/>
      <StatusBar style="auto" />
    </>
  );
}
