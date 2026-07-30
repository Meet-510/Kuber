import { Component } from 'react';

// Catches render-time errors anywhere below it and shows a fallback UI
// instead of unmounting the whole app to a blank white screen.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In a real app this would report to Sentry/Datadog; console for the demo.
    console.error('Uncaught render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-gray-100">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-6 px-6 py-2.5"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
