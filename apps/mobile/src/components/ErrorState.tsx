import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { Button } from '@/components/Button';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<Props> = ({ message, onRetry }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{message ?? 'Something went wrong.'}</Text>
    {onRetry ? <Button label="Try again" onPress={onRetry} style={styles.button} /> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    margin: 16,
    gap: 12
  },
  text: {
    color: colors.danger,
    fontSize: 16
  },
  button: {
    alignSelf: 'flex-start'
  }
});
