import React from 'react';
import { View, Text } from 'react-native';
import type { LocalAlternative } from '../../lib/types';
import { formatDistance } from '../../lib/utils';
import { colors } from '../../lib/theme';

interface LocalAlternativeCardProps {
  alternative: LocalAlternative;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Text
          key={i}
          style={{
            fontSize: 10,
            color: i < full || (i === full && half) ? colors.warning : '#2E2E2E',
          }}
        >
          ★
        </Text>
      ))}
      <Text style={{ color: colors.subtle, fontSize: 10, marginLeft: 3 }}>{rating.toFixed(1)}</Text>
    </View>
  );
}

export default function LocalAlternativeCard({ alternative }: LocalAlternativeCardProps) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 14,
        marginRight: 10,
        width: 172,
      }}
    >
      <Text
        style={{ color: colors.text, fontWeight: '600', fontSize: 13, marginBottom: 4, lineHeight: 18 }}
        numberOfLines={2}
      >
        {alternative.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View
          style={{
            backgroundColor: 'rgba(0,209,255,0.1)',
            borderRadius: 99,
            paddingHorizontal: 7,
            paddingVertical: 2,
          }}
        >
          <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '600' }}>
            {formatDistance(alternative.distance_km)}
          </Text>
        </View>
      </View>
      <Text
        style={{ color: colors.subtle, fontSize: 11, lineHeight: 16, marginBottom: 8 }}
        numberOfLines={2}
      >
        {alternative.address}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {alternative.rating !== null && <StarRating rating={alternative.rating} />}
        {alternative.price_level !== null && (
          <Text style={{ color: colors.subtle, fontSize: 11 }}>
            {'$'.repeat(Math.min(alternative.price_level, 4))}
          </Text>
        )}
      </View>
    </View>
  );
}
