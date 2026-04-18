import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
import ScoreRing from '../../components/results/ScoreRing';
import VerdictBadge from '../../components/results/VerdictBadge';
import ReasoningCard from '../../components/results/ReasoningCard';
import LocalAlternativeCard from '../../components/results/LocalAlternativeCard';
import OnlineAlternativeCard from '../../components/results/OnlineAlternativeCard';
import type { ScanResult } from '../../lib/types';

function AnimatedScore({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 700;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  return (
    <Text style={{ fontSize: 52, fontWeight: '900', color, letterSpacing: -2, lineHeight: 56 }}>
      {displayed}
    </Text>
  );
}

export default function ResultsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentScan, scans } = useSiftStore();

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [breakdown, setBreakdown] = useState<{
    price: number; quality: number; ethics: number; health: number; speed: number;
  } | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const contentOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(16);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }));

  useEffect(() => {
    async function loadScan() {
      let found: ScanResult | null =
        currentScan?.id === scanId
          ? currentScan
          : scans.find((s) => s.id === scanId) ?? null;

      if (!found) {
        const { data } = await supabase
          .from('scans')
          .select('*')
          .eq('id', scanId)
          .single();

        if (data) {
          found = {
            id: data.id,
            user_id: data.user_id,
            image_url: data.image_url,
            item_name: data.item_name,
            item_category: data.item_category,
            score: data.score,
            verdict: data.verdict,
            reasoning: data.reasoning,
            local_alternatives: data.local_alternatives ?? [],
            online_alternatives: data.online_alternatives ?? [],
            location_lat: data.location_lat,
            location_lng: data.location_lng,
            created_at: data.created_at,
          };
          if (data.raw_response?.score_breakdown) {
            setBreakdown(data.raw_response.score_breakdown);
          }
        }
      }

      setScan(found);
      setLoading(false);
      contentOpacity.value = withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) });
      contentTranslate.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
    }

    loadScan();
  }, [scanId]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleShare = async () => {
    if (!scan) return;
    await Share.share({
      message: `I scanned "${scan.item_name}" with Sift — ${scan.score}/100 · ${scan.verdict.toUpperCase()}. "${scan.reasoning}"`,
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          Scan not found
        </Text>
        <Pressable onPress={handleBack}>
          <Text style={{ color: colors.primary, fontSize: 14 }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const color = verdictColor(scan.verdict);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Ambient verdict color glow at top */}
      <LinearGradient
        colors={[`${color}1A`, `${color}06`, '#0A0A0A00']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
        pointerEvents="none"
      />

      {/* Back button */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 16,
          zIndex: 10,
        }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19l-7-7 7-7"
              stroke={colors.text}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      </View>

      <Animated.ScrollView
        style={[{ flex: 1 }, contentStyle]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View
          style={{
            alignItems: 'center',
            paddingTop: insets.top + 32,
            paddingBottom: 32,
            paddingHorizontal: 24,
          }}
        >
          {/* Score ring */}
          <View style={{ position: 'relative', marginBottom: 20 }}>
            <ScoreRing score={scan.score} size={180} />
            <View
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AnimatedScore score={scan.score} color={color} />
              <Text style={{ color: colors.subtle, fontSize: 12, fontWeight: '600', marginTop: -2 }}>
                / 100
              </Text>
            </View>
          </View>

          <VerdictBadge verdict={scan.verdict} />
          <Text
            style={{
              color: colors.text,
              fontWeight: '800',
              fontSize: 22,
              letterSpacing: -0.5,
              lineHeight: 28,
              textAlign: 'center',
              marginTop: 14,
            }}
            numberOfLines={2}
          >
            {scan.item_name}
          </Text>
        </View>

        {/* ── Reasoning ── */}
        <ReasoningCard scan={scan} breakdown={breakdown} />

        {/* ── Local alternatives ── */}
        {scan.local_alternatives.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                marginBottom: 12,
                gap: 10,
              }}
            >
              <Text
                style={{
                  color: colors.subtle,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Nearby
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {scan.local_alternatives.map((alt) => (
                <LocalAlternativeCard key={alt.id} alternative={alt} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Online alternatives ── */}
        {scan.online_alternatives.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                marginBottom: 12,
                gap: 10,
              }}
            >
              <Text
                style={{
                  color: colors.subtle,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                Online
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
            {scan.online_alternatives.map((alt) => (
              <OnlineAlternativeCard key={alt.id} alternative={alt} />
            ))}
          </View>
        )}

        {/* ── Empty alternatives ── */}
        {scan.local_alternatives.length === 0 && scan.online_alternatives.length === 0 && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              backgroundColor: colors.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 28, marginBottom: 10 }}>🔍</Text>
            <Text
              style={{
                color: colors.text,
                fontWeight: '600',
                fontSize: 14,
                marginBottom: 6,
              }}
            >
              No alternatives found
            </Text>
            <Text
              style={{
                color: colors.subtle,
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 18,
              }}
            >
              Enable location or adjust your search radius in Profile to see nearby options.
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Bottom action bar ── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          paddingHorizontal: 16,
          gap: 10,
          paddingBottom: insets.bottom + 14,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: colors.surface,
          backgroundColor: `${colors.background}F5`,
        }}
      >
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? colors.card : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          })}
        >
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>Scan Again</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => ({
            flex: 1,
            backgroundColor: pressed ? `${color}30` : `${color}18`,
            borderWidth: 1,
            borderColor: `${color}40`,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          })}
        >
          <Text style={{ color, fontWeight: '600', fontSize: 14 }}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}
