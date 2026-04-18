import { View } from 'react-native';
import { colors } from '../lib/theme';

// Safe initial route. The auth guard in _layout.tsx redirects from here
// immediately. Without this file, expo-router defaults to (tabs)/index.tsx
// (the camera screen) during the auth-check window, which causes native
// Reanimated / camera initialisation to run before auth completes — the
// root cause of the Expo Go infinite spin.
export default function IndexRoute() {
  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
