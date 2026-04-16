import React from 'react';
import { View, Text } from 'react-native';
import type { LocalAlternative } from '../../lib/types';
import { formatDistance } from '../../lib/utils';

interface LocalAlternativeCardProps {
  alternative: LocalAlternative;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View className="flex-row items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <Text
          key={i}
          style={{ fontSize: 10, color: i < full || (i === full && half) ? '#FFB300' : '#2A2A2A' }}
        >
          ★
        </Text>
      ))}
      <Text className="text-muted text-xs ml-1">{rating.toFixed(1)}</Text>
    </View>
  );
}

function PriceLevel({ level }: { level: number }) {
  return (
    <Text className="text-muted text-xs">
      {'$'.repeat(Math.min(level, 4))}
      <Text style={{ color: '#2A2A2A' }}>{'$'.repeat(Math.max(0, 4 - level))}</Text>
    </Text>
  );
}

export default function LocalAlternativeCard({ alternative }: LocalAlternativeCardProps) {
  return (
    <View
      className="bg-card border border-border rounded-2xl p-4 mr-3"
      style={{ width: 180 }}
    >
      <Text className="text-text font-semibold text-sm mb-1 leading-tight" numberOfLines={2}>
        {alternative.name}
      </Text>
      <Text className="text-accent text-xs mb-2">{formatDistance(alternative.distance_km)}</Text>
      <Text className="text-muted text-xs mb-2 leading-tight" numberOfLines={2}>
        {alternative.address}
      </Text>
      <View className="flex-row items-center justify-between">
        {alternative.rating !== null && <StarRating rating={alternative.rating} />}
        {alternative.price_level !== null && <PriceLevel level={alternative.price_level} />}
      </View>
    </View>
  );
}
