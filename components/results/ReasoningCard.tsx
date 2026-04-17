import React from 'react';
import { View, Text } from 'react-native';
import type { ScanResult } from '../../lib/types';
import { colors } from '../../lib/theme';

interface ScoreBreakdown {
  price: number;
  quality: number;
  ethics: number;
  health: number;
  speed: number;
}

interface ReasoningCardProps {
  scan: ScanResult;
  breakdown?: ScoreBreakdown;
}

const DIMENSIONS: { key: keyof ScoreBreakdown; label: string; icon: string }[] = [
  { key: 'price', label: 'Price', icon: '💰' },
  { key: 'quality', label: 'Quality', icon: '⭐' },
  { key: 'ethics', label: 'Ethics', icon: '🌱' },
  { key: 'health', label: 'Health', icon: '💪' },
  { key: 'speed', label: 'Speed', icon: '⚡' },
];

function ScoreBar({ label, icon, value }: { label: string; icon: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger;

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 12 }}>{icon}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '500' }}>{label}</Text>
        </View>
        <Text style={{ color, fontSize: 12, fontWeight: '700' }}>{pct}</Text>
      </View>
      <View
        style={{
          height: 4,
          backgroundColor: colors.border,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}

export default function ReasoningCard({ scan, breakdown }: ReasoningCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 16,
      }}
    >
      <Text
        style={{
          color: '#E0E0E0',
          fontSize: 14,
          lineHeight: 22,
          fontWeight: '400',
        }}
      >
        {scan.reasoning}
      </Text>

      {breakdown && (
        <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#242424' }}>
          <Text
            style={{
              color: colors.subtle,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            Score Breakdown
          </Text>
          {DIMENSIONS.map(({ key, label, icon }) => (
            <ScoreBar key={key} label={label} icon={icon} value={breakdown[key]} />
          ))}
        </View>
      )}
    </View>
  );
}
