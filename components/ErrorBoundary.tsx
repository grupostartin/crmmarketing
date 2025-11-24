import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
          <div className="bg-retro-surface border-4 border-black shadow-pixel p-8 max-w-2xl w-full">
            <h1 className="font-header text-2xl text-retro-red mb-4">⚠️ Erro na Aplicação</h1>
            <p className="text-retro-fg mb-4">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-retro-comment cursor-pointer mb-2">Detalhes do erro</summary>
                <pre className="bg-retro-bg border-2 border-black p-4 text-xs text-retro-comment overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-retro-cyan text-black border-2 border-black px-4 py-2 font-header text-sm uppercase hover:bg-white transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

