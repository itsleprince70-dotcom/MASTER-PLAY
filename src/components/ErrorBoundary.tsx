import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MASTER PLAY Global Error Caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080C16] text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {this.props.fallbackTitle || 'Erè afichaj'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {this.props.fallbackMessage ||
                  'Yon erè teknik rive pandan chajman paj la. Peze bouton anba a pou rechaje.'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-950/40 text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Rechaje Paj la</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl transition-all border border-slate-700 text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                <span>Retounen sou Akèy</span>
              </button>
            </div>

            {this.state.error && (
              <details className="text-left pt-2">
                <summary className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer text-center">
                  Detay teknik
                </summary>
                <pre className="mt-2 p-2.5 bg-black/50 rounded-xl text-[10px] text-red-400 font-mono overflow-auto max-h-32 border border-slate-800">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
