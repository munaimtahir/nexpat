import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '@/features/auth/AuthContext';

jest.mock('@/features/auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('react-native-paper', () => {
  const React = jest.requireActual('react');
  const { Text: RNText, View, TextInput: RNTextInput, TouchableOpacity } = jest.requireActual('react-native');
  
  return {
    Button: ({ children, onPress, loading, ...props }: any) => (
      <TouchableOpacity onPress={onPress} disabled={loading} {...props}>
        <RNText>{loading ? 'Loading...' : children}</RNText>
      </TouchableOpacity>
    ),
    TextInput: React.forwardRef(({ label, value, onChangeText, error, ...props }: any, ref: any) => (
      <View>
        <RNText>{label}</RNText>
        <RNTextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          testID={`input-${label}`}
          {...props}
        />
        {error && <RNText>Error</RNText>}
      </View>
    ))
  };
});

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginScreen', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      logout: jest.fn(),
      user: null,
      isAuthenticated: false,
      role: null
    });
  });

  it('renders login form with username and password fields', () => {
    const { getByText, getByTestId } = render(<LoginScreen />);

    expect(getByText('login.username')).toBeTruthy();
    expect(getByText('login.password')).toBeTruthy();
    expect(getByText('login.submit')).toBeTruthy();
  });

  it('calls login with correct credentials on submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    
    const { getByTestId, getByText } = render(<LoginScreen />);

    const usernameInput = getByTestId('input-login.username');
    const passwordInput = getByTestId('input-login.password');
    const submitButton = getByText('login.submit');

    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'testpass');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'testpass'
      });
    });
  });

  it('displays error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    
    const { getByTestId, getByText } = render(<LoginScreen />);

    const usernameInput = getByTestId('input-login.username');
    const passwordInput = getByTestId('input-login.password');
    const submitButton = getByText('login.submit');

    fireEvent.changeText(usernameInput, 'wronguser');
    fireEvent.changeText(passwordInput, 'wrongpass');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('shows loading state during login', () => {
    mockedUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      logout: jest.fn(),
      user: null,
      isAuthenticated: false,
      role: null
    });

    const { getByText } = render(<LoginScreen />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('validates required fields', async () => {
    const { getByText } = render(<LoginScreen />);

    const submitButton = getByText('login.submit');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });
});
