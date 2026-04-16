import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export interface SiftCameraRef {
  capturePhoto: () => Promise<string>;
}

const SiftCamera = React.forwardRef<SiftCameraRef, Record<string, never>>(
  (_props, ref) => {
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();

    const capturePhoto = useCallback(async (): Promise<string> => {
      if (!cameraRef.current) throw new Error('Camera not ready');
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
        exif: false,
      });
      if (!photo?.base64) throw new Error('No base64 data returned');
      return photo.base64;
    }, []);

    React.useImperativeHandle(ref, () => ({ capturePhoto }), [capturePhoto]);

    if (!permission) {
      return <View className="flex-1 bg-background" />;
    }

    if (!permission.granted) {
      return (
        <View className="flex-1 bg-background items-center justify-center px-8">
          <Text className="text-text text-2xl font-bold mb-3 text-center">Camera Access Needed</Text>
          <Text className="text-muted text-base text-center mb-8">
            Sift needs your camera to scan and analyze items.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-primary px-8 py-4 rounded-xl"
          >
            <Text className="text-text font-bold text-base">Enable Camera</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
      />
    );
  },
);

SiftCamera.displayName = 'SiftCamera';

export default SiftCamera;
