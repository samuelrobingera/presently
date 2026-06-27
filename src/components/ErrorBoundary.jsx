import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
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
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-rose-600" />
              </div>
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-4">
              Something went wrong
            </h1>

            <p className="text-slate-600 mb-8 leading-relaxed">
              Presently encountered an unexpected error. This has been logged and we'll look into it.
              Please try refreshing the page or returning to the home screen.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Development Error Details
                </p>
                <div className="text-sm text-rose-600 font-mono mb-4 break-all">
                  {this.state.error.toString()}
                </div>
                {this.state.errorInfo && (
                  <details className="text-xs text-slate-700 font-mono">
                    <summary className="cursor-pointer font-bold text-slate-600 mb-2">
                      Stack Trace
                    </summary>
                    <pre className="whitespace-pre-wrap break-all bg-white p-4 rounded border border-slate-200 overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-full hover:bg-slate-800 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-8 py-3 bg-white text-slate-900 font-bold rounded-full border-2 border-slate-900 hover:bg-slate-50 transition-colors"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
