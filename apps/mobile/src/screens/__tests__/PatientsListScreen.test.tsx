import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PatientsListScreen } from '../PatientsListScreen';
import { usePatients } from '@/api/hooks/usePatients';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

jest.mock('@/api/hooks/usePatients', () => ({
  usePatients: jest.fn()
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useFocusEffect: jest.fn((callback) => callback())
}));

jest.mock('react-native-paper', () => {
  const React = jest.requireActual('react');
  const { Text: RNText, TouchableOpacity } = jest.requireActual('react-native');
  
  return {
    Button: ({ children, onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <RNText>{children}</RNText>
      </TouchableOpacity>
    )
  };
});

jest.mock('@/components/SearchBar', () => ({
  SearchBar: ({ value, onChange, placeholder }: any) => {
    const { TextInput } = jest.requireActual('react-native');
    return <TextInput value={value} onChangeText={onChange} placeholder={placeholder} testID="search-bar" />;
  }
}));

jest.mock('@/components/CachedDataNotice', () => ({
  CachedDataNotice: () => null
}));

jest.mock('@/components/LoadingIndicator', () => ({
  LoadingIndicator: () => {
    const { Text } = jest.requireActual('react-native');
    return <Text>Loading...</Text>;
  }
}));

jest.mock('@/components/ErrorState', () => ({
  ErrorState: ({ message }: any) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{message}</Text>;
  }
}));

jest.mock('@/components/Card', () => ({
  Card: ({ children }: any) => {
    const { View } = jest.requireActual('react-native');
    return <View>{children}</View>;
  }
}));

const mockedUsePatients = usePatients as jest.MockedFunction<typeof usePatients>;
const mockedUseNavigation = useNavigation as jest.MockedFunction<typeof useNavigation>;

describe('PatientsListScreen', () => {
  const mockNavigate = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigation.mockReturnValue({
      navigate: mockNavigate,
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      isFocused: jest.fn()
    } as any);
  });

  it('shows loading state when fetching patients', () => {
    mockedUsePatients.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch
    } as any);

    const { getByText } = render(<PatientsListScreen />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('shows error state when query fails', () => {
    mockedUsePatients.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isRefetching: false,
      refetch: mockRefetch
    } as any);

    const { getByText } = render(<PatientsListScreen />);

    expect(getByText('Unable to load patients')).toBeTruthy();
  });

  it('renders patient list when data is available', () => {
    mockedUsePatients.mockReturnValue({
      data: {
        results: [
          { id: 1, first_name: 'John', last_name: 'Doe', phone: '1234567890', notes: 'Test note' },
          { id: 2, first_name: 'Jane', last_name: 'Smith', phone: null, notes: null }
        ]
      },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch
    } as any);

    const { getByText } = render(<PatientsListScreen />);

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('1234567890')).toBeTruthy();
    expect(getByText('Test note')).toBeTruthy();
    expect(getByText('Jane Smith')).toBeTruthy();
  });

  it('navigates to patient detail when patient card is pressed', () => {
    mockedUsePatients.mockReturnValue({
      data: {
        results: [
          { id: 1, first_name: 'John', last_name: 'Doe', phone: '1234567890', notes: null }
        ]
      },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch
    } as any);

    const { getByText } = render(<PatientsListScreen />);

    const patientCard = getByText('John Doe');
    fireEvent.press(patientCard);

    expect(mockNavigate).toHaveBeenCalledWith('PatientDetail', { patientId: 1 });
  });

  it('navigates to add patient form when add button is pressed', () => {
    mockedUsePatients.mockReturnValue({
      data: { results: [] },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch
    } as any);

    const { getByText } = render(<PatientsListScreen />);

    const addButton = getByText('Add patient');
    fireEvent.press(addButton);

    expect(mockNavigate).toHaveBeenCalledWith('PatientForm', {});
  });

  it('filters patients based on search input', async () => {
    const mockRefetchWithSearch = jest.fn();
    mockedUsePatients.mockReturnValue({
      data: { results: [] },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetchWithSearch
    } as any);

    const { getByTestId } = render(<PatientsListScreen />);

    const searchBar = getByTestId('search-bar');
    fireEvent.changeText(searchBar, 'John');

    await waitFor(() => {
      expect(mockedUsePatients).toHaveBeenCalledWith({ search: 'John' });
    });
  });

  it('shows empty state when no patients found', () => {
    mockedUsePatients.mockReturnValue({
      data: { results: [] },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch
    } as any);

    const { getByText } = render(<PatientsListScreen />);

    expect(getByText('No patients yet')).toBeTruthy();
  });

  it('refetches data on focus', () => {
    mockedUsePatients.mockReturnValue({
      data: { results: [] },
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch
    } as any);

    render(<PatientsListScreen />);

    expect(mockRefetch).toHaveBeenCalled();
  });
});
