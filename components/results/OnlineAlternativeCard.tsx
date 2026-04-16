import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import type { OnlineAlternative } from '../../lib/types';
import { formatPrice } from '../../lib/utils';

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
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: '#1E1E1E',
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
            backgroundColor: '#1A1A1A',
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
            backgroundColor: '#1A1A1A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 22 }}>🛍️</Text>
        </View>
      )}

      <View style={{ flex: 1, marginRight: 12 }}>
        <Text
          style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13, lineHeight: 18, marginBottom: 2 }}
          numberOfLines={2}
        >
          {alternative.name}
        </Text>
        <Text style={{ color: '#444444', fontSize: 11, marginBottom: 4 }}>{alternative.merchant}</Text>
        <Text style={{ color: '#00E676', fontWeight: '700', fontSize: 14 }}>
          {formatPrice(alternative.price, alternative.currency)}
        </Text>
      </View>

      <Pressable
        onPress={handleView}
        style={({ pressed }) => ({
          backgroundColor: pressed ? 'rgba(108,71,255,0.25)' : 'rgba(108,71,255,0.12)',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 8,
        })}
      >
        <Text style={{ color: '#6C47FF', fontSize: 12, fontWeight: '700' }}>View</Text>
      </Pressable>
    </View>
  );
}
