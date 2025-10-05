import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import { elevations } from '@/theme/elevations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardVariant = 'default' | 'elevated' | 'gradient' | 'glass';

type Props = React.PropsWithChildren<{
  variant?: CardVariant;
  accentColors?: [string, string];
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}>;

export const Card: React.FC<Props> = ({
  children,
  variant = 'default',
  accentColors,
  onPress,
  style
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.97, { damping: 18, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 160 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const baseContent = (
    <View style={[styles.content, variant === 'glass' ? styles.glass : null]}>{children}</View>
  );

  if (variant === 'gradient') {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={[styles.shadow, style, animatedStyle]}
      >
        <LinearGradient
          colors={accentColors ?? [colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, styles.gradient]}
        >
          <View style={styles.content}>{children}</View>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.shadow, style, animatedStyle]}
      >
        <View style={[styles.container, variant === 'elevated' ? styles.elevated : null]}>{baseContent}</View>
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.shadow, style]}>
      <View style={[styles.container, variant === 'elevated' ? styles.elevated : null]}>{baseContent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    marginHorizontal: 16,
    marginBottom: 16
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    padding: 20
  },
  content: {
    gap: 12
  },
  elevated: {
    ...elevations.level2,
    backgroundColor: '#111827'
  },
  gradient: {
    ...elevations.level3
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)'
  }
});
