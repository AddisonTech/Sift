import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PreferenceSlider from '../../components/ui/PreferenceSlider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { usePreferences } from '../../hooks/usePreferences';
import { useSiftStore } from '../../store';
import type { UserPreferences } from '../../lib/types';
import { colors } from '../../lib/theme';

const ONBOARDING_KEY = 'sift_onboarding_done';

const WEIGHT_FIELDS: {
  key: keyof Pick<UserPreferences, 'price_weight' | 'quality_weight' | 'ethics_weight' | 'health_weight' | 'speed_weight'>;
  label: string;
  icon: string;
  description: string;
}[] = [
  { key: 'price_weight', label: 'Price', icon: '💰', description: 'How much cost matters' },
  { key: 'quality_weight', label: 'Quality', icon: '⭐', description: 'Build quality & durability' },
  { key: 'ethics_weight', label: 'Ethics', icon: '🌱', description: 'Sustainability & sourcing' },
  { key: 'health_weight', label: 'Health', icon: '💪', description: 'Nutritional & health impact' },
  { key: 'speed_weight', label: 'Speed', icon: '⚡', description: 'Convenience & accessibility' },
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

const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher', 'Nut-Free'];

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {children}
    </View>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: colors.subtle,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingHorizontal: 4,
      }}
    >
      {title}
    </Text>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { preferences, updatePreferences } = usePreferences();
  const { scans } = useSiftStore();

  const avgScore = scans.length > 0
    ? Math.round(scans.reduce((acc, s) => acc + s.score, 0) / scans.length)
    : null;

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
      if (data.user) {
        setEmail(data.user.email ?? '');
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            setDisplayName(
              profile?.display_name ?? data.user?.user_metadata?.display_name ?? '',
            );
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
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 20,
          paddingBottom: 28,
        }}
      >
        {/* Avatar with gradient ring */}
        <LinearGradient
          colors={[`${colors.primary}99`, `${colors.primary}33`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text }}>
              {displayName ? displayName[0].toUpperCase() : '?'}
            </Text>
          </View>
        </LinearGradient>

        <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.8 }}>
          {displayName || 'Guest'}
        </Text>
        {email ? (
          <Text style={{ color: colors.subtle, fontSize: 13, marginTop: 3 }}>{email}</Text>
        ) : null}

        {/* Stats row */}
        {scans.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 16,
              gap: 0,
            }}
          >
            <View style={{ alignItems: 'center', paddingRight: 20 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 20, letterSpacing: -0.5 }}>
                {scans.length}
              </Text>
              <Text style={{ color: colors.subtle, fontSize: 11, marginTop: 1 }}>Scans</Text>
            </View>
            <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />
            {avgScore !== null && (
              <View style={{ alignItems: 'center', paddingLeft: 20 }}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 20, letterSpacing: -0.5 }}>
                  {avgScore}
                </Text>
                <Text style={{ color: colors.subtle, fontSize: 11, marginTop: 1 }}>Avg Score</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 16 }}>

        {/* ── Priorities ── */}
        <SectionLabel title="Priorities" />
        <SectionCard>
          {WEIGHT_FIELDS.map(({ key, label, icon, description }, index) => (
            <View
              key={key}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: index < WEIGHT_FIELDS.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ fontSize: 14, marginRight: 8 }}>{icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
                  <Text style={{ color: colors.subtle, fontSize: 11, marginTop: 1 }}>{description}</Text>
                </View>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>
                  {preferences[key]}
                </Text>
              </View>
              <PreferenceSlider
                value={preferences[key] as number}
                onValueChange={(v) => debouncedUpdate({ [key]: v })}
                min={1}
                max={10}
              />
            </View>
          ))}
        </SectionCard>

        {/* ── Budget ── */}
        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <SectionLabel title="Budget" />
          <SectionCard>
            <View style={{ flexDirection: 'row', padding: 6 }}>
              {BUDGET_OPTIONS.map(({ value, label }) => (
                <Pressable
                  key={value}
                  onPress={() => updatePreferences({ budget: value })}
                  style={{
                    flex: 1,
                    backgroundColor: preferences.budget === value ? colors.primary : 'transparent',
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: 'center',
                    margin: 2,
                  }}
                >
                  <Text
                    style={{
                      color: preferences.budget === value ? colors.text : colors.subtle,
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>
        </View>

        {/* ── Distance ── */}
        <SectionLabel title="Search Radius" />
        <SectionCard>
          <View style={{ flexDirection: 'row', padding: 6 }}>
            {DISTANCE_OPTIONS.map(({ value, label }) => (
              <Pressable
                key={value}
                onPress={() => updatePreferences({ distance_radius_km: value })}
                style={{
                  flex: 1,
                  backgroundColor: preferences.distance_radius_km === value ? colors.primary : 'transparent',
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                  margin: 2,
                }}
              >
                <Text
                  style={{
                    color: preferences.distance_radius_km === value ? colors.text : colors.subtle,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* ── Dietary ── */}
        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <SectionLabel title="Dietary" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DIETARY_OPTIONS.map((tag) => {
              const lower = tag.toLowerCase();
              const active = preferences.dietary.includes(lower);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleDietary(tag)}
                  style={{
                    backgroundColor: active ? `${colors.primary}26` : colors.surface,
                    borderColor: active ? `${colors.primary}80` : colors.border,
                    borderWidth: 1,
                    borderRadius: 99,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                  }}
                >
                  <Text
                    style={{
                      color: active ? colors.primary : colors.subtle,
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

        {/* ── Toggles ── */}
        <View style={{ marginTop: 4, marginBottom: 12 }}>
          <SectionLabel title="Options" />
          <SectionCard>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                  Avoid chain restaurants
                </Text>
                <Text style={{ color: colors.subtle, fontSize: 12, marginTop: 2 }}>
                  Prefer independent options
                </Text>
              </View>
              <Switch
                value={preferences.avoid_chains}
                onValueChange={(v) => updatePreferences({ avoid_chains: v })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
          </SectionCard>
        </View>

        {/* ── Sign Out ── */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => ({
            backgroundColor: pressed ? `${colors.danger}18` : 'transparent',
            borderWidth: 1,
            borderColor: `${colors.danger}33`,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 12,
            marginBottom: 4,
          })}
        >
          <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 14 }}>Sign Out</Text>
        </Pressable>

        <Text style={{ color: colors.placeholder, fontSize: 11, textAlign: 'center', marginTop: 16 }}>
          Sift v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
