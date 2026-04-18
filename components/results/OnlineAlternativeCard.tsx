import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import type { OnlineAlternative } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import { colors } from '../../lib/theme';

interface OnlineAlternativeCardProps {
  alternative: OnlineAlternative;
}

export default function OnlineAlternativeCard({ alternative }: OnlineAlternativeCardProps) {
  const handleView = () => {
    if (alternative.url) {
      Linking.openURL(alternative.url);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        marginHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {alternative.image_url ? (
        <Image
          source={{ uri: alternative.image_url }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            marginRight: 14,
            backgroundColor: colors.border,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            marginRight: 14,
            backgroundColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22 }}>🛍️</Text>
        </View>
      )}

      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{ color: colors.text, fontWeight: '600', fontSize: 13, lineHeight: 18, marginBottom: 2 }}
          numberOfLines={2}
        >
          {alternative.name}
        </Text>
        <Text style={{ color: colors.subtle, fontSize: 11, marginBottom: 4 }}>{alternative.merchant}</Text>
        <Text style={{ color: colors.success, fontWeight: '700', fontSize: 14 }}>
          {formatPrice(alternative.price, alternative.currency)}
        </Text>
      </View>

      <Pressable
        onPress={handleView}
        style={({ pressed }) => ({
          backgroundColor: pressed ? `${colors.primary}40` : `${colors.primary}1F`,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
        })}
      >
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>View</Text>
      </Pressable>
    </View>
  );
}
