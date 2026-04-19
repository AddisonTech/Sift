import { Platform } from 'react-native';
if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

const isBrowser = typeof window !== 'undefined';

// During SSR (Node.js static render) window is undefined - provide a no-op
// so createClient() succeeds. On native use AsyncStorage. On web let Supabase
// use its built-in localStorage adapter (undefined = default).
const noopStorage = {
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, _value: string) => Promise.resolve(),
  removeItem: (_key: string) => Promise.resolve(),
};

function getStorage() {
  if (!isBrowser) return noopStorage;            // SSR: no-op
  if (Platform.OS !== 'web') return AsyncStorage; // native: AsyncStorage
  return undefined;                               // browser: Supabase default (localStorage)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: isBrowser,
    persistSession: isBrowser,
    detectSessionInUrl: false,
  },
});
