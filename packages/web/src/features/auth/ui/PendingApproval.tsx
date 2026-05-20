import { Brand, Button, Card } from "../../../shared/ui";
import { useRepositories } from "../../../infrastructure/RepositoriesContext";
import { useAuthState } from "../hooks/useAuthState";

export function PendingApproval() {
  const { user } = useAuthState();
  const { auth } = useRepositories();
  return (
    <main className="min-h-screen flex items-center justify-center bg-(--color-background) px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Brand size="lg" />
        </div>
        <Card elevated>
          <div className="text-center">
            <h1 className="text-xl font-medium text-(--color-text)">
              In attesa di approvazione
            </h1>
            <p className="text-sm text-(--color-text-muted) mt-3">
              Hai effettuato l&apos;accesso come{" "}
              <span className="text-(--color-text)">{user?.email ?? "—"}</span>.
            </p>
            <p className="text-sm text-(--color-text-muted) mt-2">
              Un amministratore deve approvare il tuo account. Al prossimo
              accesso dopo l&apos;approvazione potrai usare l&apos;app.
            </p>
            <div className="mt-8">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void auth.signOut()}
              >
                Esci
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
