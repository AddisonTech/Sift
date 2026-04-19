import '../global.css';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Stack, Redirect, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../lib/supabase';
import { useSiftStore } from '../store';
import { colors } from '../lib/theme';
import type { Session } from '@supabase/supabase-js';

const ONBOARDING_KEY = 'sift_onboarding_done';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#FF3D71', fontSize: 13, textAlign: 'center' }}>
            {this.state.error}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const segments = useSegments();
  const { onboardingDone, setOnboardingDone } = useSiftStore();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);

  // Hard timeout: force resolution after 4s
  useEffect(() => {
    const timer = setTimeout(() => {
      setSession(s => s === undefined ? null : s);
      setOnboardingLoaded(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    }).catch(() => {
      setSession(null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Seed onboardingDone from AsyncStorage once session resolves
  useEffect(() => {
    if (session === undefined) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === 'true');
      setOnboardingLoaded(true);
    }).catch(() => {
      setOnboardingDone(false);
      setOnboardingLoaded(true);
    });
  }, [session]);

  // Show blank loading screen until auth + onboarding state are known
  if (session === undefined || !onboardingLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: colors.background }} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Compute redirect target declaratively - avoids router.replace() timing issues in SPA mode
  const inAuth = segments[0] === '(auth)';
  const inOnboarding = segments[0] === '(onboarding)';
  // At root = initial SPA load before any navigation, segments is []
  const atRoot = segments.length === 0;

  let redirectTo: string | null = null;
  if (!session && !inAuth) {
    redirectTo = '/(auth)/login';
  } else if (session && !onboardingDone && !inOnboarding) {
    redirectTo = '/(onboarding)/welcome';
  } else if (session && onboardingDone && (inAuth || inOnboarding || atRoot)) {
    // Redirect to tabs from wrong groups or from the bare root.
    // Leave /results and any other valid app routes alone.
    redirectTo = '/(tabs)';
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'none',
            }}
          />
          {redirectTo && <Redirect href={redirectTo as any} />}
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
