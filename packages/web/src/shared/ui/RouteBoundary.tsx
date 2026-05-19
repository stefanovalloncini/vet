import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Brand } from "./Brand";
import { Card } from "./Card";

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
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Brand size="lg" />
          </div>
          <Card elevated className="text-center">
            <p className="text-base font-medium text-(--color-text) mb-2">
              Qualcosa è andato storto.
            </p>
            <p className="text-sm text-(--color-text-muted) mb-1 break-words">
              {error.message || "Errore sconosciuto"}
            </p>
            <p className="text-xs text-(--color-text-subtle) mb-6">
              Riprova oppure torna alla home.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 font-medium px-4 py-3 text-sm rounded-xl bg-(--color-accent) text-white hover:bg-(--color-accent-hover) focus-visible:ring-2 focus-visible:ring-(--color-accent) transition-colors"
              >
                Ricarica
              </button>
              <Link
                to="/"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 font-medium px-4 py-3 text-sm rounded-xl bg-(--color-surface) border border-(--color-border) text-(--color-text) hover:border-(--color-border-strong) hover:bg-(--color-surface-muted) transition-colors"
              >
                Vai alla home
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }
}
