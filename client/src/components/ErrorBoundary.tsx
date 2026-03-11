import { Component, type ReactNode } from "react";
import { Shield, RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[100dvh] bg-[#0a0a0f] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
              <p className="text-sm text-gray-400">
                An unexpected error occurred. Try refreshing the page.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-left">
                <p className="text-xs font-mono text-red-300/70 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                data-testid="button-try-again"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-sm text-cyan-300 hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                data-testid="button-reload"
              >
                <Shield className="w-4 h-4" />
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
