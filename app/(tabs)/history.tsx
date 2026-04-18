import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useSiftStore } from '../../store';
import { verdictColor } from '../../lib/utils';
import { colors } from '../../lib/theme';
import type { ScanResult, ItemCategory, VerdictType } from '../../lib/types';

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  product: '📦',
  restaurant: '🍽️',
  food: '🥗',
  service: '🔧',
  other: '🔍',
};

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ScanItem({ scan, onPress }: { scan: ScanResult; onPress: () => void }) {
  const dateStr = relativeDate(scan.created_at);
  const icon = CATEGORY_ICONS[scan.item_category] ?? '🔍';
  const color = verdictColor(scan.verdict);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: pressed ? colors.card : colors.surface,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 10,
        overflow: 'hidden',
      })}
    >
      {/* Verdict color accent bar */}
      <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: color, borderRadius: 2 }} />

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, paddingLeft: 16 }}>
        {/* Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>

        {/* Text */}
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            style={{ color: colors.text, fontWeight: '600', fontSize: 14, marginBottom: 4 }}
            numberOfLines={1}
          >
            {scan.item_name}
          </Text>
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: `${color}18`,
              borderRadius: 99,
              paddingHorizontal: 8,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
              {scan.verdict.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Score + date */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color, fontWeight: '800', fontSize: 20, letterSpacing: -0.5 }}>
            {scan.score}
          </Text>
          <Text style={{ color: colors.subtle, fontSize: 11, marginTop: 2 }}>{dateStr}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function AnimatedEmptyState() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) });
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }, style]}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 32 }}>📷</Text>
      </View>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
        Nothing scanned yet
      </Text>
      <Text style={{ color: colors.subtle, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
        Point your camera at any item to get a score and smarter alternatives.
      </Text>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scans, setScans } = useSiftStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const listOpacity = useSharedValue(0);
  const listStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
  }));

  const fetchScans = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      setScans(
        data.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          image_url: row.image_url,
          item_name: row.item_name,
          item_category: row.item_category as ItemCategory,
          score: row.score,
          verdict: row.verdict as VerdictType,
          reasoning: row.reasoning,
          local_alternatives: row.local_alternatives ?? [],
          online_alternatives: row.online_alternatives ?? [],
          location_lat: row.location_lat,
          location_lng: row.location_lng,
          created_at: row.created_at,
        })),
      );
    }
  }, []);

  useEffect(() => {
    fetchScans().finally(() => {
      setLoading(false);
      listOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    });
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchScans();
    setRefreshing(false);
  }, [fetchScans]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 20, paddingBottom: 16 }}>
        <Text
          style={{
            fontSize: 30,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: -1,
          }}
        >
          History
        </Text>
        {scans.length > 0 && (
          <Text style={{ color: colors.subtle, fontSize: 13, marginTop: 3 }}>
            {scans.length} scan{scans.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <Animated.View style={[{ flex: 1 }, listStyle]}>
        <FlashList
          data={scans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ScanItem
              scan={item}
              onPress={() => router.push(`/results/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={<AnimatedEmptyState />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      </Animated.View>
    </View>
  );
}
