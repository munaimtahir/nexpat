import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { typography } from '@/theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Option {
  label: string;
  value: string;
}

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}

export const FilterChips: React.FC<Props> = ({ value, options, onChange }) => (
  <View style={styles.container}>
    {options.map((option) => (
      <Chip key={option.value} label={option.label} active={option.value === value} onPress={() => onChange(option.value)} />
    ))}
  </View>
);

const Chip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => {
  const pressed = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    pressed.value = withSpring(active ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [active, pressed]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pressed.value, [0, 1], ['rgba(148, 163, 184, 0.2)', '#6366F1']),
    borderColor: interpolateColor(pressed.value, [0, 1], ['rgba(148, 163, 184, 0.4)', '#8B5CF6'])
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(pressed.value, [0, 1], ['#CBD5F5', '#F8FAFC'])
  }));

  return (
    <AnimatedPressable onPress={onPress} style={[styles.chip, animatedStyle]}>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16
  },
  chip: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight
  }
});
