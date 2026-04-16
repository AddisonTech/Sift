import React from 'react';
import { View, Text } from 'react-native';
import type { ScanResult } from '../../lib/types';

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

const DIMENSIONS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: 'price', label: 'Price' },
  { key: 'quality', label: 'Quality' },
  { key: 'ethics', label: 'Ethics' },
  { key: 'health', label: 'Health' },
  { key: 'speed', label: 'Speed' },
];

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-muted text-xs">{label}</Text>
        <Text className="text-muted text-xs">{pct}</Text>
      </View>
      <View className="h-1 bg-border rounded-full overflow-hidden">
        <View
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

export default function ReasoningCard({ scan, breakdown }: ReasoningCardProps) {
  return (
    <View className="bg-card rounded-2xl p-5 mx-4 mb-4">
      <Text className="text-text text-sm leading-relaxed mb-5">{scan.reasoning}</Text>
      {breakdown && (
        <View>
          <Text className="text-muted text-xs font-semibold mb-3 uppercase tracking-wider">
            Score Breakdown
          </Text>
          {DIMENSIONS.map(({ key, label }) => (
            <ScoreBar key={key} label={label} value={breakdown[key]} />
          ))}
        </View>
      )}
    </View>
  );
}
