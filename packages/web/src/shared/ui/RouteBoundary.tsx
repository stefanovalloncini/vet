import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class RouteBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("route boundary caught", error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-(--color-background)">
        <div className="max-w-md w-full bg-(--color-surface) border border-(--color-border) rounded-2xl p-7 text-center">
          <p className="text-base font-medium text-(--color-text) mb-2">
            Qualcosa è andato storto.
          </p>
          <p className="text-sm text-(--color-text-muted) mb-1">
            {error.message || "Errore sconosciuto"}
          </p>
          <p className="text-xs text-(--color-text-subtle) mb-5">
            Riprova oppure torna alla home.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-md bg-(--color-accent) text-white text-sm font-medium hover:opacity-90"
            >
              Ricarica
            </button>
            <Link
              to="/"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-md border border-(--color-border) text-sm text-(--color-text-muted) hover:text-(--color-text)"
            >
              Vai alla home
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
