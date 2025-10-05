import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with the correct label prop', () => {
    const { getByText } = render(<Button label="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('renders with children prop', () => {
    const { getByText } = render(<Button><Text>Child Text</Text></Button>);
    expect(getByText('Child Text')).toBeTruthy();
  });

  it('prefers children over label prop', () => {
    const { getByText, queryByText } = render(<Button label="Label"><Text>Child</Text></Button>);
    expect(getByText('Child')).toBeTruthy();
    expect(queryByText('Label')).toBeNull();
  });

  it('handles onPress events', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button label="Test Button" onPress={onPressMock} />);
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not handle onPress events when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button label="Test Button" onPress={onPressMock} disabled />);
    fireEvent.press(getByText('Test Button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByText, queryByText } = render(<Button label="Test Button" loading />);
    expect(getByText('...')).toBeTruthy();
    expect(queryByText('Test Button')).toBeNull();
  });

  it('is disabled when loading', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button label="Test Button" onPress={onPressMock} loading />);
    fireEvent.press(getByText('...'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders primary variant', () => {
    const { getByText } = render(<Button variant="primary" label="Primary Button" />);
    expect(getByText('Primary Button')).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { getByText } = render(<Button variant="secondary" label="Secondary Button" />);
    expect(getByText('Secondary Button')).toBeTruthy();
  });

  it('renders glass variant', () => {
    const { getByText } = render(<Button variant="glass" label="Glass Button" />);
    expect(getByText('Glass Button')).toBeTruthy();
  });

  it('renders an icon when provided', () => {
    const { getByText } = render(
      <Button icon={<Text>Icon</Text>} label="With Icon" />
    );
    expect(getByText('Icon')).toBeTruthy();
  });
});