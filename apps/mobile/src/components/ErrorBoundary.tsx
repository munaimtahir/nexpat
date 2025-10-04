import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { Sentry } from '@/providers/sentry';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      }
    });

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We&apos;re sorry, but something unexpected happened. The error has been reported to our team.
          </Text>
          <Button mode="contained" onPress={this.handleReset} style={styles.button}>
            Try Again
          </Button>
          {__DEV__ && this.state.error && (
            <ScrollView style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
              <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              {this.state.errorInfo && (
                <Text style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
              )}
            </ScrollView>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000000'
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666666'
  },
  button: {
    marginTop: 16
  },
  errorDetails: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f5f5f5',
    maxHeight: 200,
    width: '100%'
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#d32f2f'
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333333'
  }
});
