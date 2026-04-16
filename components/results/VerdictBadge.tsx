import React from 'react';
import { Text, View } from 'react-native';
import type { VerdictType } from '../../lib/types';
import { verdictColor } from '../../lib/utils';

interface VerdictBadgeProps {
  verdict: VerdictType;
  size?: 'sm' | 'md';
}

export default function VerdictBadge({ verdict, size = 'md' }: VerdictBadgeProps) {
  const color = verdictColor(verdict);
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        borderColor: `${color}55`,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: isSmall ? 10 : 16,
        paddingVertical: isSmall ? 3 : 6,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color,
          fontSize: isSmall ? 11 : 14,
          fontWeight: '700',
          letterSpacing: 0.5,
        }}
      >
        {verdict.toUpperCase()}
      </Text>
    </View>
  );
}
