import type { Capability } from "./registry.js";

/**
 * Capability bundles for the three product roles described in the client
 * transcript. These are the source of truth for what a freshly-seeded role
 * gets; admin UIs can offer "Create role from bundle" using these arrays as
 * the starting point. The bundles compose: veterinario_capo ⊃ veterinario,
 * amministratore ⊃ veterinario_capo.
 */

export const VETERINARIO_CAPS: ReadonlyArray<Capability> = [
  "activities.read.all",
  "activities.create",
  "activities.update.own",
  "activities.delete.own",
  "activities.export",
  "aziende.read",
  "aziende.create",
  "aziende.update",
  "activity_types.read",
  "trash.read.own",
  "trash.restore.own",
  "conti.proforma",
  "reminders.read",
  "reminders.create",
  "reminders.update.own",
  "reminders.delete.own",
];

export const VETERINARIO_CAPO_CAPS: ReadonlyArray<Capability> = [
  ...VETERINARIO_CAPS,
  "conti.emit",
  "conti.saldo",
];

export const AMMINISTRATORE_CAPS: ReadonlyArray<Capability> = [
  ...VETERINARIO_CAPO_CAPS,
  "roles.read",
  "roles.manage",
  "roles.assign",
  "allowlist.read",
  "allowlist.manage",
  "users.approve",
  "users.read.all",
  "audit.read",
];

export interface RoleBundle {
  readonly id: string;
  readonly name: string;
  readonly caps: ReadonlyArray<Capability>;
}

export const ROLE_BUNDLES: ReadonlyArray<RoleBundle> = [
  {
    id: "veterinario_semplice",
    name: "Veterinario semplice",
    caps: VETERINARIO_CAPS,
  },
  {
    id: "veterinario_capo",
    name: "Veterinario capo",
    caps: VETERINARIO_CAPO_CAPS,
  },
  {
    id: "amministratore",
    name: "Amministratore",
    caps: AMMINISTRATORE_CAPS,
  },
];
