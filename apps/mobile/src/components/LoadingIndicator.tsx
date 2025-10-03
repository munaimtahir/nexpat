import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/theme/colors';

export const LoadingIndicator: React.FC = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);
