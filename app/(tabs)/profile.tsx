import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import PreferenceSlider from '../../components/ui/PreferenceSlider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { usePreferences } from '../../hooks/usePreferences';
import type { UserPreferences } from '../../lib/types';

const ONBOARDING_KEY = 'sift_onboarding_done';

const WEIGHT_FIELDS: {
  key: keyof Pick<UserPreferences, 'price_weight' | 'quality_weight' | 'ethics_weight' | 'health_weight' | 'speed_weight'>;
  label: string;
  icon: string;
}[] = [
  { key: 'price_weight', label: 'Price', icon: '💰' },
  { key: 'quality_weight', label: 'Quality', icon: '⭐' },
  { key: 'ethics_weight', label: 'Ethics', icon: '🌱' },
  { key: 'health_weight', label: 'Health', icon: '💪' },
  { key: 'speed_weight', label: 'Speed', icon: '⚡' },
];

const BUDGET_OPTIONS: { value: UserPreferences['budget']; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'mid', label: 'Mid-range' },
  { value: 'premium', label: 'Premium' },
];

const DISTANCE_OPTIONS: { value: number; label: string }[] = [
  { value: 1.6, label: '1 mi' },
  { value: 8, label: '5 mi' },
  { value: 16, label: '10 mi' },
  { value: 40, label: '25 mi' },
];

const DIETARY_OPTIONS = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Kosher',
  'Nut-Free',
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { preferences, updatePreferences } = usePreferences();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdate = useCallback((partial: Partial<UserPreferences>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updatePreferences(partial);
    }, 500);
  }, [updatePreferences]);

  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '');
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            setDisplayName(profile?.display_name ?? data.user?.user_metadata?.display_name ?? '');
          });
      }
    });
  }, []);

  const handleSignOut = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const toggleDietary = (tag: string) => {
    const lower = tag.toLowerCase();
    const updated = preferences.dietary.includes(lower)
      ? preferences.dietary.filter((d) => d !== lower)
      : [...preferences.dietary, lower];
    updatePreferences({ dietary: updated });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
    >
      <View className="px-6" style={{ paddingTop: insets.top + 16, paddingBottom: 24 }}>
        <Text
          style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8 }}
        >
          {displayName || 'Profile'}
        </Text>
        {email ? (
          <Text className="text-muted text-sm mt-1">{email}</Text>
        ) : null}
      </View>

      <View className="px-6 mb-2">
        <Text className="text-muted text-xs font-semibold mb-4 uppercase tracking-wider">
          Preferences
        </Text>
        {WEIGHT_FIELDS.map(({ key, label, icon }) => (
          <View key={key} className="mb-5">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <Text style={{ fontSize: 15, marginRight: 8 }}>{icon}</Text>
                <Text className="text-text font-medium text-sm">{label}</Text>
              </View>
              <Text className="text-primary font-bold text-sm">{preferences[key]}</Text>
            </View>
            <PreferenceSlider
              value={preferences[key] as number}
              onValueChange={(v) => debouncedUpdate({ [key]: v })}
              min={1}
              max={10}
            />
          </View>
        ))}
      </View>

      <View className="px-6 mb-6">
        <Text className="text-muted text-xs font-semibold mb-3 uppercase tracking-wider">
          Budget
        </Text>
        <View className="flex-row gap-2">
          {BUDGET_OPTIONS.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => updatePreferences({ budget: value })}
              style={{
                flex: 1,
                backgroundColor: preferences.budget === value ? '#6C47FF' : '#1C1C1C',
                borderColor: preferences.budget === value ? '#6C47FF' : '#2A2A2A',
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: preferences.budget === value ? '#FFFFFF' : '#9E9E9E',
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="px-6 mb-6">
        <Text className="text-muted text-xs font-semibold mb-3 uppercase tracking-wider">
          Distance Radius
        </Text>
        <View className="flex-row gap-2">
          {DISTANCE_OPTIONS.map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => updatePreferences({ distance_radius_km: value })}
              style={{
                flex: 1,
                backgroundColor: preferences.distance_radius_km === value ? '#6C47FF' : '#1C1C1C',
                borderColor: preferences.distance_radius_km === value ? '#6C47FF' : '#2A2A2A',
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: preferences.distance_radius_km === value ? '#FFFFFF' : '#9E9E9E',
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="px-6 mb-6">
        <Text className="text-muted text-xs font-semibold mb-3 uppercase tracking-wider">
          Dietary
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {DIETARY_OPTIONS.map((tag) => {
            const lower = tag.toLowerCase();
            const active = preferences.dietary.includes(lower);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleDietary(tag)}
                style={{
                  backgroundColor: active ? '#6C47FF22' : '#1C1C1C',
                  borderColor: active ? '#6C47FF88' : '#2A2A2A',
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text
                  style={{
                    color: active ? '#6C47FF' : '#9E9E9E',
                    fontSize: 13,
                    fontWeight: '600',
                  }}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="px-6 mb-8">
        <View className="flex-row items-center justify-between bg-card border border-border rounded-xl p-4">
          <Text className="text-text text-sm font-medium">Avoid chain restaurants</Text>
          <Switch
            value={preferences.avoid_chains}
            onValueChange={(v) => updatePreferences({ avoid_chains: v })}
            trackColor={{ false: '#2A2A2A', true: '#6C47FF' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View className="px-6 mb-4">
        <Pressable
          onPress={handleSignOut}
          className="bg-danger/10 border border-danger/30 rounded-xl py-4 items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-danger font-semibold text-sm">Sign Out</Text>
        </Pressable>
      </View>

      <Text className="text-muted text-xs text-center">Sift v1.0.0</Text>
    </ScrollView>
  );
}
