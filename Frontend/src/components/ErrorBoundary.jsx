import { Component } from 'react';

// Catches render-time errors anywhere below it and shows a fallback UI
// instead of unmounting the whole app to a blank white screen.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <div className="max-w-md">
          <p className="eyebrow mb-6">Error</p>
          <h1 className="serif text-5xl leading-[0.98] tracking-tight text-ink">
            Something went <span className="serif-italic text-ink-3">wrong.</span>
          </h1>
          <p className="mt-4 text-base text-ink-3">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-8"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
