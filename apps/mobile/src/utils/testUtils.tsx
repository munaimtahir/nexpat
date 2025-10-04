/**
 * Test utilities providing reusable mock component builders.
 * 
 * Note: Due to Jest's hoisting restrictions with jest.mock(), these utilities
 * help reduce code duplication. Functions are prefixed with 'mock' to satisfy
 * Jest's requirements for use within jest.mock() factory functions.
 * 
 * Usage pattern in test files:
 * ```ts
 * jest.mock('react-native-paper', () => {
 *   const React = jest.requireActual('react');
 *   const { Text: RNText } = jest.requireActual('react-native');
 *   const { mockCreateReactNativePaperMock } = jest.requireActual('@/utils/testUtils');
 *   return mockCreateReactNativePaperMock(React, RNText);
 * });
 * ```
 */

import React from 'react';
import type { Text as RNTextType, View as RNViewType } from 'react-native';

type ReactType = typeof React;

/**
 * Creates a basic react-native-paper mock with Icon, Text, and useTheme.
 * Reduces duplication of mock component definitions.
 * 
 * Prefixed with 'mock' to allow use within jest.mock() factory functions.
 */
export function mockCreateReactNativePaperMock(
  React: ReactType,
  RNText: typeof RNTextType,
  _View?: typeof RNViewType
) {
  return {
    Icon: () => null,
    Text: ({ children, ...props }: React.ComponentProps<typeof RNText>) => (
      <RNText {...props}>{children}</RNText>
    ),
    useTheme: () => ({
      colors: {
        secondaryContainer: '#eee',
        onSecondaryContainer: '#111'
      }
    })
  };
}

/**
 * Creates a comprehensive react-native-paper mock with Banner, Dialog, Button, and List components.
 * Reduces duplication of complex mock component definitions.
 * 
 * Prefixed with 'mock' to allow use within jest.mock() factory functions.
 */
export function mockCreateReactNativePaperMockWithBanner(
  React: ReactType,
  RNText: typeof RNTextType,
  View: typeof RNViewType
) {
  const BannerMock = ({
    children,
    actions
  }: {
    children: React.ReactNode;
    actions?: { label: string; onPress: () => void }[];
  }) => (
    <View>
      <View>{children}</View>
      {actions?.map((action) => (
        <RNText key={action.label} onPress={action.onPress}>
          {action.label}
        </RNText>
      ))}
    </View>
  );
  BannerMock.displayName = 'BannerMock';

  const ButtonMock = ({
    children,
    onPress
  }: {
    children: React.ReactNode;
    onPress?: () => void;
  }) => <RNText onPress={onPress ?? (() => undefined)}>{children}</RNText>;
  ButtonMock.displayName = 'ButtonMock';

  type MockDialogComponentProps = { visible: boolean; children: React.ReactNode };
  type MockDialogComponentType = React.FC<MockDialogComponentProps> & {
    Title: React.FC<{ children: React.ReactNode }>;
    Content: React.FC<{ children: React.ReactNode }>;
    Actions: React.FC<{ children: React.ReactNode }>;
  };

  const DialogComponent = (({ visible, children }) => (
    <View>{visible ? children : null}</View>
  )) as MockDialogComponentType;
  DialogComponent.displayName = 'DialogMock';

  const DialogTitleMock = ({ children }: { children: React.ReactNode }) => (
    <RNText>{children}</RNText>
  );
  DialogTitleMock.displayName = 'DialogTitleMock';

  const DialogContentMock = ({
    children
  }: {
    children: React.ReactNode;
  }) => <View>{children}</View>;
  DialogContentMock.displayName = 'DialogContentMock';

  const DialogActionsMock = ({
    children
  }: {
    children: React.ReactNode;
  }) => <View>{children}</View>;
  DialogActionsMock.displayName = 'DialogActionsMock';

  DialogComponent.Title = DialogTitleMock;
  DialogComponent.Content = DialogContentMock;
  DialogComponent.Actions = DialogActionsMock;

  const ListSectionMock = ({ children }: { children: React.ReactNode }) => (
    <View>{children}</View>
  );
  ListSectionMock.displayName = 'ListSectionMock';

  const ListItemMock = ({
    title,
    description
  }: {
    title: string;
    description?: string;
  }) => (
    <View>
      <RNText>{title}</RNText>
      {description ? <RNText>{description}</RNText> : null}
    </View>
  );
  ListItemMock.displayName = 'ListItemMock';

  return {
    Banner: BannerMock,
    Button: ButtonMock,
    Dialog: DialogComponent,
    List: {
      Icon: () => null,
      Section: ListSectionMock,
      Item: ListItemMock
    },
    Text: ({ children, ...props }: React.ComponentProps<typeof RNText>) => (
      <RNText {...props}>{children}</RNText>
    ),
    Icon: () => null,
    useTheme: () => ({
      colors: {
        errorContainer: '#fee',
        onErrorContainer: '#900',
        primaryContainer: '#eef',
        onPrimaryContainer: '#006'
      }
    }),
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>
  };
}


