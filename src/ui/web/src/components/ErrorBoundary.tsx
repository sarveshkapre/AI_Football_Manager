import React from 'react';
import { clearAfmStorage } from '../utils/storage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('AFM UI crashed', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoCoach = () => {
    window.location.hash = '#coach';
    window.location.reload();
  };

  private handleReset = () => {
    clearAfmStorage();
    window.location.hash = '#coach';
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="page-content" style={{ padding: '48px 24px' }}>
        <div className="card surface" style={{ maxWidth: 720, margin: '0 auto' }}>
          <h3>Something went wrong</h3>
          <p className="muted">
            The prototype hit an unexpected error. Reloading usually fixes it. If it persists, reset
            local app data.
          </p>
          <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn primary" onClick={this.handleReload}>
              Reload
            </button>
            <button className="btn" onClick={this.handleGoCoach}>
              Go to Coach Mode
            </button>
            <button className="btn" onClick={this.handleReset}>
              Reset local data
            </button>
          </div>
          <details style={{ marginTop: 16 }}>
            <summary className="muted">Error details</summary>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
          </details>
        </div>
      </div>
    );
  }
}

