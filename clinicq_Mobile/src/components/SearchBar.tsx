import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<Props> = ({ value, onChange, placeholder }) => (
  <View style={styles.container}>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder ?? 'Search'}
      style={styles.input}
      placeholderTextColor={colors.muted}
      accessibilityLabel={placeholder ?? 'Search'}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  input: {
    padding: 12,
    fontSize: 16
  }
});
