import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  message?: string;
}

export const ErrorState: React.FC<Props> = ({ message }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{message ?? 'Something went wrong.'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    margin: 16
  },
  text: {
    color: colors.danger,
    fontSize: 16
  }
});
