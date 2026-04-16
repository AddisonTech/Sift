import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

const ONBOARDING_KEY = 'sift_onboarding_done';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  // navigatorReady defers redirects until after the first render cycle,
  // ensuring expo-router's navigator is mounted before any replace() call.
  const [navigatorReady, setNavigatorReady] = useState(false);

  useEffect(() => {
    // Mark navigator as ready after the first render
    setNavigatorReady(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === 'true');
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Wait until all async state is resolved and the navigator is mounted
    if (session === undefined || onboardingDone === null || !navigatorReady) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }

    if (!onboardingDone) {
      if (!inOnboarding) router.replace('/(onboarding)/welcome');
      return;
    }

    if (inAuth || inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [session, onboardingDone, segments, navigatorReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0A0A0A' },
            animation: 'fade',
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
