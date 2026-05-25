import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ActorContext, Capability, Repositories } from "@vet/shared";
import { CAPABILITIES } from "@vet/shared";
import { RepositoriesProvider } from "../../../infrastructure/RepositoriesContext";
import { createInMemoryRepositories } from "../../../infrastructure/composition/in-memory";
import { createQueryClient } from "../../../shared/data/queryClient";
import { AllowlistPage } from "../../admin-allowlist";
import { RolesListPage } from "../../admin-roles";
import { AuditPage } from "../../admin-audit";
import { VetStatsPage } from "../../admin-vet-stats";

type View = "allowlist" | "roles" | "audit" | "stats";

function makeAdmin(): ActorContext {
  return {
    uid: "preview-admin",
    email: "admin@vet.it",
    displayName: "Preview Admin",
    roleId: "admin",
    caps: new Set(CAPABILITIES as ReadonlyArray<Capability>),
    approved: true,
  };
}

let seedingPromise: Promise<void> | null = null;

async function seed(repos: Repositories): Promise<void> {
  const admin = makeAdmin();
  (repos.auth as { setSimulatedUser?: (u: ActorContext) => void }).setSimulatedUser?.(admin);

  await repos.roles.create("vet", { name: "Veterinario semplice", capabilities: ["activities.read.all", "activities.create"], description: "Vet di base" }, admin.uid);
  await repos.roles.create("vet-capo", { name: "Veterinario capo", capabilities: ["activities.read.all", "activities.create", "users.read.all"], description: "Titolare" }, admin.uid);
  await repos.roles.create("admin", { name: "Amministratore", capabilities: [...CAPABILITIES] as Capability[], description: "Amministratore di sistema" }, admin.uid);

  await repos.allowlist.add({ email: "admin@vet.it", defaultRoleId: "admin", notes: "Account principale" }, admin.uid);
  await repos.allowlist.add({ email: "mario.rossi@vet.it", defaultRoleId: "vet" }, admin.uid);
  await repos.allowlist.add({ email: "lucia.verdi@vet.it", defaultRoleId: "vet" }, admin.uid);
  await repos.allowlist.add({ email: "anna.bianchi@vet.it", defaultRoleId: "vet-capo", notes: "Veterinaria senior" }, admin.uid);
  await repos.allowlist.add({ email: "paolo.neri@vet.it", defaultRoleId: "vet" }, admin.uid);

  await repos.accessRequests.record({ email: "richiesta1@vet.it", emailNorm: "richiesta1@vet.it", displayName: "Nuovo Vet", providerId: "google.com" });
  await repos.accessRequests.record({ email: "richiesta2@vet.it", emailNorm: "richiesta2@vet.it", displayName: "Aspirante", providerId: "emailLink" });
  await repos.accessRequests.record({ email: "richiesta3@vet.it", emailNorm: "richiesta3@vet.it", displayName: "Sconosciuto", providerId: "google.com" });

  const eventsList: Array<{ action: import("@vet/shared").AuditAction; targetType: import("@vet/shared").AuditTargetType; targetId: string }> = [
    { action: "user.approve", targetType: "user", targetId: "u-1" },
    { action: "allowlist.add", targetType: "allowlist", targetId: "mario.rossi@vet.it" },
    { action: "role.update", targetType: "role", targetId: "vet" },
    { action: "attivita.delete", targetType: "attivita", targetId: "att-99" },
    { action: "access_request.accept", targetType: "access_request", targetId: "x@vet.it" },
    { action: "user.session.revoke", targetType: "user", targetId: "u-2" },
  ];
  for (const a of eventsList) {
    await repos.audit.record({ actorUid: admin.uid, actorEmail: admin.email, action: a.action, targetType: a.targetType, targetId: a.targetId });
  }

  const aziendaA = await repos.aziende.create({ nome: "Stalla Rossi" }, admin);
  await repos.activityTypes.upsert("visita", { nome: "Visita", ordine: 10, attivo: true });
  for (let i = 0; i < 12; i++) {
    const vetUid = i % 3 === 0 ? "vet-uid-1" : i % 3 === 1 ? "vet-uid-2" : "vet-uid-3";
    const ownerMap: Record<string, { email: string; nome: string }> = {
      "vet-uid-1": { email: "mario.rossi@vet.it", nome: "Mario Rossi" },
      "vet-uid-2": { email: "lucia.verdi@vet.it", nome: "Lucia Verdi" },
      "vet-uid-3": { email: "anna.bianchi@vet.it", nome: "Anna Bianchi" },
    };
    const info = ownerMap[vetUid]!;
    const owner: ActorContext = {
      uid: vetUid,
      email: info.email,
      displayName: info.nome,
      roleId: "vet",
      caps: new Set(CAPABILITIES as ReadonlyArray<Capability>),
      approved: true,
    };
    await repos.attivita.create(
      { data: new Date(Date.now() - i * 86_400_000), aziendaId: aziendaA.id, tipoId: "visita", oraria: false, adElemento: false, tariffa: 50 + i * 10 },
      { aziendaNome: "Stalla Rossi", tipoNome: "Visita" },
      owner
    );
  }
}

function PreviewBoot({ children }: { children: ReactNode }) {
  const repos = useMemo(() => createInMemoryRepositories(), []);
  const client = useMemo(() => createQueryClient(), []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!seedingPromise) seedingPromise = seed(repos);
    void seedingPromise.then(() => setReady(true)).catch(() => setReady(true));
  }, [repos]);

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-(--color-background)">
        <p className="text-sm text-(--color-text-muted)">Preview seeding…</p>
      </main>
    );
  }
  return (
    <QueryClientProvider client={client}>
      <RepositoriesProvider value={repos}>{children}</RepositoriesProvider>
    </QueryClientProvider>
  );
}

const VIEWS: Array<{ value: View; label: string }> = [
  { value: "allowlist", label: "Allowlist (tabs interne)" },
  { value: "roles", label: "Ruoli" },
  { value: "audit", label: "Audit" },
  { value: "stats", label: "Statistiche vet" },
];

export function AdminPreviewPage() {
  const initialView = (new URLSearchParams(window.location.search).get("view") as View) || "allowlist";
  const [view, setView] = useState<View>(initialView);

  let Comp: () => ReactNode;
  if (view === "roles") Comp = RolesListPage;
  else if (view === "audit") Comp = AuditPage;
  else if (view === "stats") Comp = VetStatsPage;
  else Comp = AllowlistPage;

  return (
    <div>
      <div className="border-b border-(--color-border) bg-(--color-surface-muted) px-4 py-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-(--color-text-subtle) mr-2">
          Preview
        </span>
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => setView(v.value)}
            className={[
              "text-xs px-2.5 py-1 rounded-md transition-colors",
              view === v.value
                ? "bg-(--color-accent-soft) text-(--color-accent)"
                : "text-(--color-text-muted) hover:bg-(--color-surface)",
            ].join(" ")}
          >
            {v.label}
          </button>
        ))}
      </div>
      <PreviewBoot>
        <Comp />
      </PreviewBoot>
    </div>
  );
}
