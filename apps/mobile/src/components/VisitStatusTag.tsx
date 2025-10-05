import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import type { Visit } from '@/api/generated/types';

type Variant = 'gradient' | 'glass' | 'solid';

interface Props {
  status: Visit['status'] | string;
  variant?: Variant;
}

const STATUS_GRADIENTS: Record<string, [string, string]> = {
  waiting: ['#FBBF24', '#F97316'],
  in_progress: ['#818CF8', '#6366F1'],
  completed: ['#34D399', '#059669'],
  cancelled: ['#F87171', '#EF4444']
};

const STATUS_SOLIDS: Record<string, string> = {
  waiting: colors.warning,
  in_progress: colors.secondary,
  completed: colors.success,
  cancelled: colors.danger
};

const STATUS_TEXT: Record<string, string> = {
  waiting: '#431407',
  in_progress: '#F8FAFC',
  completed: '#022C22',
  cancelled: '#F8FAFC'
};

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export const VisitStatusTag: React.FC<Props> = ({ status, variant = 'gradient' }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1.08, { damping: 10, stiffness: 260 });
    scale.value = withDelay(120, withSpring(1, { damping: 16, stiffness: 180 }));
  }, [scale, status]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const label = status.replace('_', ' ');
  const textColor = variant === 'glass' ? '#E0E7FF' : STATUS_TEXT[status] ?? '#0F172A';

  if (variant === 'glass') {
    return (
      <Animated.View style={[styles.glassWrapper, animatedStyle]}>
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      </Animated.View>
    );
  }

  if (variant === 'solid') {
    return (
      <Animated.View style={[styles.container, animatedStyle, { backgroundColor: STATUS_SOLIDS[status] ?? colors.muted }]}>
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      </Animated.View>
    );
  }

  return (
    <AnimatedGradient
      colors={STATUS_GRADIENTS[status] ?? STATUS_GRADIENTS.waiting}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, animatedStyle]}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </AnimatedGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  text: {
    color: '#0F172A',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.6
  },
  glassWrapper: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)'
  }
});
