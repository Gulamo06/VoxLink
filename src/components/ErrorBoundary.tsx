import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-text">Something went wrong</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-text transition hover:opacity-90"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.assign('/')}
              className="mt-3 w-full rounded-full border border-border bg-background px-4 py-3 text-sm text-text-secondary transition hover:bg-surface"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
