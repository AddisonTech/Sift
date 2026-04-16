import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useSiftStore } from '../../store';
import VerdictBadge from '../../components/results/VerdictBadge';
import type { ScanResult, ItemCategory, VerdictType } from '../../lib/types';

const CATEGORY_ICONS: Record<ItemCategory, string> = {
  product: '📦',
  restaurant: '🍽️',
  food: '🥗',
  service: '🔧',
  other: '🔍',
};

function ScanItem({ scan, onPress }: { scan: ScanResult; onPress: () => void }) {
  const date = new Date(scan.created_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const icon = CATEGORY_ICONS[scan.item_category] ?? '🔍';

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-card border border-border rounded-2xl p-4 mx-4 mb-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View
        className="w-12 h-12 rounded-xl bg-surface items-center justify-center mr-4"
        style={{ flexShrink: 0 }}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <View className="flex-1 mr-3">
        <Text className="text-text font-semibold text-sm mb-1" numberOfLines={1}>
          {scan.item_name}
        </Text>
        <VerdictBadge verdict={scan.verdict} size="sm" />
      </View>
      <View className="items-end">
        <Text className="text-text font-bold text-lg">{scan.score}</Text>
        <Text className="text-muted text-xs mt-0.5">{dateStr}</Text>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scans, setScans } = useSiftStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    fetchScans().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchScans();
    setRefreshing(false);
  }, [fetchScans]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-4 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text
          style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.8 }}
        >
          History
        </Text>
      </View>

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
            tintColor="#6C47FF"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-32 px-8">
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📷</Text>
            <Text className="text-text font-bold text-lg text-center mb-2">No scans yet</Text>
            <Text className="text-muted text-sm text-center">
              Point your camera at something to get started.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      />
    </View>
  );
}
