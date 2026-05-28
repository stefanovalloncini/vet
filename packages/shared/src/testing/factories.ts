import type { Capability } from "../domain/caps/registry.js";
import type { AccessRequest } from "../domain/entities/AccessRequest.js";
import type { ActivityType } from "../domain/entities/ActivityType.js";
import type { ActorContext } from "../domain/entities/ActorContext.js";
import type { AllowlistEntry } from "../domain/entities/AllowlistEntry.js";
import type { Attivita } from "../domain/entities/Attivita.js";
import type { AuditEvent } from "../domain/entities/AuditEvent.js";
import type { Azienda } from "../domain/entities/Azienda.js";
import type { Conto } from "../domain/entities/Conto.js";
import type { Reminder } from "../domain/entities/Reminder.js";
import type { Role } from "../domain/entities/Role.js";
import type { User } from "../domain/entities/User.js";

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

const EPOCH = new Date("2026-05-15T10:00:00.000Z");

export function makeAttivita(overrides: Partial<Attivita> = {}): Attivita {
  const base: Attivita = {
    id: nextId("att"),
    data: EPOCH,
    aziendaId: "az-1",
    aziendaNome: "Cascina San Marco",
    tipoId: "tipo-visita",
    tipoNome: "Visita",
    oraria: false,
    adElemento: false,
    tariffa: 50,
    totale: 50,
    ownerUid: "owner-uid",
    ownerEmail: "owner@example.it",
    ownerName: "Vet Uno",
    createdAt: EPOCH,
    updatedAt: EPOCH,
    isDeleted: false,
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export function makeUser(overrides: Partial<User> = {}): User {
  const uid = overrides.uid ?? nextId("usr");
  const base: User = {
    uid,
    email: `${uid}@example.it`,
    displayName: "Vet Uno",
    roleId: "veterinario_semplice",
    approved: true,
    disabled: false,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export interface ActorContextOverrides
  extends Partial<Omit<ActorContext, "caps">> {
  caps?: ReadonlySet<Capability> | readonly Capability[];
}

export function makeActorContext(
  overrides: ActorContextOverrides = {}
): ActorContext {
  const { caps, ...rest } = overrides;
  const base: ActorContext = {
    uid: "owner-uid",
    email: "owner@example.it",
    displayName: "Vet Uno",
    roleId: "veterinario_semplice",
    caps: new Set<Capability>(),
    approved: true,
  };
  return {
    ...base,
    ...rest,
    caps: caps === undefined ? base.caps : new Set(caps),
  };
}

export function makeAzienda(overrides: Partial<Azienda> = {}): Azienda {
  const nome = overrides.nome ?? "Cascina San Marco";
  const base: Azienda = {
    id: nextId("az"),
    nome,
    nomeNorm: nome.trim().toLowerCase(),
    createdAt: EPOCH,
    updatedAt: EPOCH,
    createdBy: "owner-uid",
    updatedBy: "owner-uid",
    createdByName: "Vet Uno",
    updatedByName: "Vet Uno",
    isDeleted: false,
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export function makeActivityType(
  overrides: Partial<ActivityType> = {}
): ActivityType {
  const base: ActivityType = {
    id: nextId("tipo"),
    nome: "Visita",
    ordine: 10,
    attivo: true,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export function makeConto(overrides: Partial<Conto> = {}): Conto {
  const base: Conto = {
    id: nextId("conto"),
    aziendaId: "az-1",
    aziendaNome: "Cascina San Marco",
    periodoFrom: new Date("2026-03-01T00:00:00.000Z"),
    periodoTo: new Date("2026-03-31T23:59:59.000Z"),
    attivitaIds: ["att-1", "att-2"],
    totaleConto: 250,
    modalita: "proforma",
    saldato: false,
    emittedAt: EPOCH,
    emittedBy: "owner-uid",
    emittedByName: "Vet Uno",
    isDeleted: false,
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  const base: Reminder = {
    id: nextId("rem"),
    aziendaId: "az-1",
    aziendaNome: "Cascina San Marco",
    titolo: "Richiamo vaccinazione",
    dueAt: new Date("2026-06-01T09:00:00.000Z"),
    done: false,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    createdBy: "owner-uid",
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export function makeRole(overrides: Partial<Role> = {}): Role {
  const base: Role = {
    id: nextId("role"),
    name: "Veterinario semplice",
    capabilities: [],
    locked: false,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    createdBy: "owner-uid",
    updatedBy: "owner-uid",
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export function makeAllowlistEntry(
  overrides: Partial<AllowlistEntry> = {}
): AllowlistEntry {
  const email = overrides.email ?? "invitato@example.it";
  const base: AllowlistEntry = {
    emailNorm: email.trim().toLowerCase(),
    email,
    defaultRoleId: "veterinario_semplice",
    invitedBy: "admin-uid",
    invitedAt: EPOCH,
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export function makeAccessRequest(
  overrides: Partial<AccessRequest> = {}
): AccessRequest {
  const email = overrides.email ?? "richiesta@example.it";
  const base: AccessRequest = {
    emailNorm: email.trim().toLowerCase(),
    email,
    firstAttemptAt: EPOCH,
    lastAttemptAt: EPOCH,
    attempts: 1,
    schemaVersion: 1,
  };
  return { ...base, ...overrides };
}

export function makeAuditEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  const base: AuditEvent = {
    id: nextId("audit"),
    at: EPOCH,
    actorUid: "admin-uid",
    actorEmail: "admin@example.it",
    action: "role.update",
    targetType: "role",
    targetId: "veterinario_capo",
  };
  return { ...base, ...overrides };
}
