import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1113] text-[#E1E7EC] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#16191D] border border-[#FF4444]/30 rounded-xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FF4444]/10 border border-[#FF4444]/30 mx-auto flex items-center justify-center text-[#FF4444]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-white font-sans">Terjadi Kendala pada Aplikasi</h2>
              <p className="text-xs text-[#9BA7B4] mt-1.5 leading-relaxed">
                Aplikasi mendeteksi error tak terduga. Anda dapat me-refresh tampilan untuk melanjutkan.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#101215] border border-[#24292E] rounded-lg p-3 text-left font-mono text-[11px] text-[#FF6B6B] overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#D4FF44] hover:bg-[#E2FF70] text-[#0F1113] text-xs font-bold rounded-lg transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

