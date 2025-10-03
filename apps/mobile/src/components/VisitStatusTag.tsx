import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  waiting: colors.warning,
  in_progress: colors.secondary,
  completed: colors.success,
  cancelled: colors.danger
};

export const VisitStatusTag: React.FC<Props> = ({ status }) => (
  <View style={[styles.container, { backgroundColor: STATUS_COLORS[status] ?? colors.muted }]}>
    <Text style={styles.text}>{status.replace('_', ' ')}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8
  },
  text: {
    color: '#fff',
    fontWeight: '600'
  }
});
