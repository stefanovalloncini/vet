import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Brand } from "./Brand";
import { Card } from "./Card";

interface Props {
  children: ReactNode;
  resetKeys?: ReadonlyArray<unknown>;
}

interface State {
  error: Error | null;
}

function keysChanged(
  a: ReadonlyArray<unknown> | undefined,
  b: ReadonlyArray<unknown> | undefined
): boolean {
  if (a === b) return false;
  if (!a || !b) return true;
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i += 1) {
    if (!Object.is(a[i], b[i])) return true;
  }
  return false;
}

export class RouteBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("route boundary caught", error, info.componentStack);
  }

  override componentDidUpdate(prev: Props): void {
    if (this.state.error && keysChanged(prev.resetKeys, this.props.resetKeys)) {
      this.setState({ error: null });
    }
  }

  handleRetry = (): void => {
    this.setState({ error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    const showDetails = import.meta.env.DEV;
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-(--color-background)">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Brand size="lg" />
          </div>
          <Card elevated className="text-center">
            <p className="text-base font-medium text-(--color-text) mb-2">
              Si è verificato un errore caricando questa pagina
            </p>
            <p className="text-xs text-(--color-text-subtle) mb-6">
              Riprova oppure torna alla home.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 font-medium px-4 py-3 text-sm rounded-xl bg-(--color-accent) text-white hover:bg-(--color-accent-hover) focus-visible:ring-2 focus-visible:ring-(--color-accent) transition-colors"
              >
                Riprova
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 font-medium px-4 py-3 text-sm rounded-xl bg-(--color-surface) border border-(--color-border) text-(--color-text) hover:border-(--color-border-strong) hover:bg-(--color-surface-muted) transition-colors"
              >
                Ricarica
              </button>
              <Link
                to="/"
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 font-medium px-4 py-3 text-sm rounded-xl bg-(--color-surface) border border-(--color-border) text-(--color-text) hover:border-(--color-border-strong) hover:bg-(--color-surface-muted) transition-colors"
              >
                Vai alla home
              </Link>
            </div>
            {showDetails ? (
              <details className="mt-6 text-left text-xs text-(--color-text-muted)">
                <summary className="cursor-pointer select-none">
                  Dettagli tecnici
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words bg-(--color-surface-muted) rounded-lg p-3">
                  {error.message || "Errore sconosciuto"}
                  {error.stack ? `\n\n${error.stack}` : ""}
                </pre>
              </details>
            ) : null}
          </Card>
        </div>
      </main>
    );
  }
}
