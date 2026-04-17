import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import PreferenceSlider from '../../components/ui/PreferenceSlider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { defaultPreferences } from '../../lib/utils';
import type { UserPreferences } from '../../lib/types';
import { colors } from '../../lib/theme';

const ONBOARDING_KEY = 'sift_onboarding_done';

const WEIGHT_FIELDS: { key: keyof Pick<UserPreferences, 'price_weight' | 'quality_weight' | 'ethics_weight' | 'health_weight' | 'speed_weight'>; label: string; icon: string }[] = [
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

export default function PreferencesSetupScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<UserPreferences>(defaultPreferences());
  const [saving, setSaving] = useState(false);

  const setWeight = (key: keyof UserPreferences, value: number) => {
    setPrefs((p) => ({ ...p, [key]: Math.round(value) }));
  };

  const toggleDietary = (tag: string) => {
    const lower = tag.toLowerCase();
    setPrefs((p) => ({
      ...p,
      dietary: p.dietary.includes(lower)
        ? p.dietary.filter((d) => d !== lower)
        : [...p.dietary, lower],
    }));
  };

  const handleFinish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          price_weight: prefs.price_weight,
          quality_weight: prefs.quality_weight,
          ethics_weight: prefs.ethics_weight,
          health_weight: prefs.health_weight,
          speed_weight: prefs.speed_weight,
          dietary: prefs.dietary,
          budget: prefs.budget,
          distance_radius_km: prefs.distance_radius_km,
          avoid_chains: prefs.avoid_chains,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setSaving(false);
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <View className="px-6 pt-16 pb-6">
        <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -1 }}>
          What matters{'\n'}to you?
        </Text>
        <Text className="text-muted text-sm mt-2">
          Sift will weight your scores accordingly.
        </Text>
      </View>

      <View className="px-6 mb-6">
        {WEIGHT_FIELDS.map(({ key, label, icon }) => (
          <View key={key} className="mb-5">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <Text style={{ fontSize: 16, marginRight: 8 }}>{icon}</Text>
                <Text className="text-text font-semibold text-sm">{label}</Text>
              </View>
              <Text className="text-primary font-bold text-sm">{prefs[key]}</Text>
            </View>
            <PreferenceSlider
              value={prefs[key] as number}
              onValueChange={(v) => setWeight(key, v)}
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
              onPress={() => setPrefs((p) => ({ ...p, budget: value }))}
              style={{
                flex: 1,
                backgroundColor: prefs.budget === value ? colors.primary : colors.card,
                borderColor: prefs.budget === value ? colors.primary : colors.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: prefs.budget === value ? colors.text : colors.muted,
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
              onPress={() => setPrefs((p) => ({ ...p, distance_radius_km: value }))}
              style={{
                flex: 1,
                backgroundColor: prefs.distance_radius_km === value ? colors.primary : colors.card,
                borderColor: prefs.distance_radius_km === value ? colors.primary : colors.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: prefs.distance_radius_km === value ? colors.text : colors.muted,
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
            const active = prefs.dietary.includes(lower);
            return (
              <Pressable
                key={tag}
                onPress={() => toggleDietary(tag)}
                style={{
                  backgroundColor: active ? 'rgba(108,71,255,0.13)' : colors.card,
                  borderColor: active ? 'rgba(108,71,255,0.53)' : colors.border,
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text
                  style={{
                    color: active ? colors.primary : colors.muted,
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
            value={prefs.avoid_chains}
            onValueChange={(v) => setPrefs((p) => ({ ...p, avoid_chains: v }))}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      <View className="px-6">
        <Pressable
          onPress={handleFinish}
          disabled={saving}
          className="bg-primary rounded-xl py-4 items-center"
          style={({ pressed }) => ({ opacity: pressed || saving ? 0.7 : 1 })}
        >
          <Text className="text-text font-bold text-base">
            {saving ? 'Saving…' : "Let's go"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
