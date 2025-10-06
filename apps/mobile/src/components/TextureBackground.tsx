import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  variant?: 'aurora' | 'sunset';
}

export const TextureBackground: React.FC<Props> = ({ children, variant = 'aurora' }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [shimmer]);

  const blobOneStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [0, 25]) },
      { translateY: interpolate(shimmer.value, [0, 1], [0, -18]) },
      { scale: interpolate(shimmer.value, [0, 1], [1, 1.08]) }
    ]
  }));

  const blobTwoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [0, -18]) },
      { translateY: interpolate(shimmer.value, [0, 1], [0, 24]) },
      { scale: interpolate(shimmer.value, [0, 1], [1.02, 0.94]) }
    ]
  }));

  const colors =
    variant === 'sunset'
      ? ['#312E81', '#F97316']
      : ['#0F172A', '#4338CA'];
  const secondary = variant === 'sunset' ? '#FBBF24' : '#22D3EE';
  const tertiary = variant === 'sunset' ? '#FB7185' : '#8B5CF6';

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Animated.View pointerEvents="none" style={[styles.blob, styles.blobOne, blobOneStyle, { backgroundColor: secondary }]} />
      <Animated.View pointerEvents="none" style={[styles.blob, styles.blobTwo, blobTwoStyle, { backgroundColor: tertiary }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  blob: {
    position: 'absolute',
    opacity: 0.18,
    borderRadius: 320
  },
  blobOne: {
    width: 320,
    height: 320,
    top: -120,
    right: -100
  },
  blobTwo: {
    width: 280,
    height: 280,
    bottom: -100,
    left: -80
  },
  content: {
    flex: 1,
    paddingTop: 12
  }
});
