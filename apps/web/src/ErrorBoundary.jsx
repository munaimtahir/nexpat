import { Component } from 'react'
import * as Sentry from '@sentry/react'

/**
 * A React error boundary that reports errors to a monitoring service.
 *
 * If `VITE_SENTRY_DSN` is defined, errors are captured using Sentry. In
 * addition, if `VITE_LOG_ENDPOINT` is set, a POST request containing the error
 * and component stack is sent to that endpoint. This makes the monitoring
 * destination configurable via environment variables.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: errorInfo })
    }

    const endpoint = import.meta.env.VITE_LOG_ENDPOINT
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            name: error && error.name ? error.name : undefined,
            message: error && error.message ? error.message : undefined,
            stack: error && error.stack ? error.stack : undefined,
            toString: error ? error.toString() : undefined,
          },
          componentStack: errorInfo.componentStack,
        }),
      }).catch(() => {
        /* Swallow network errors to avoid cascading failures */
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>
            <p>
              Something went wrong. Please try refreshing the page. If the
              problem persists, contact support.
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

