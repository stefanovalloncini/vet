import { describe, expect, it } from "vitest";
import {
  AMMINISTRATORE_CAPS,
  ROLE_BUNDLES,
  TITOLARE_CAPS,
  VETERINARIO_CAPS,
} from "../bundles.js";
import { isCapability } from "../registry.js";

const has = (caps: ReadonlyArray<string>, c: string): boolean => caps.includes(c);

const ALL_BUNDLES = [
  VETERINARIO_CAPS,
  TITOLARE_CAPS,
  AMMINISTRATORE_CAPS,
];

describe("capability bundles", () => {
  it("compose: titolare ⊇ veterinario_semplice, amministratore ⊇ titolare", () => {
    for (const c of VETERINARIO_CAPS) expect(TITOLARE_CAPS).toContain(c);
    for (const c of TITOLARE_CAPS) expect(AMMINISTRATORE_CAPS).toContain(c);
  });

  it("contains no duplicate capabilities", () => {
    for (const bundle of ALL_BUNDLES) {
      expect(new Set(bundle).size).toBe(bundle.length);
    }
  });

  it("references only valid registry capabilities", () => {
    for (const bundle of ALL_BUNDLES) {
      for (const c of bundle) expect(isCapability(c)).toBe(true);
    }
  });

  it("keeps the base veterinario role least-privileged", () => {
    // Privileged actions must NOT leak into the base bundle (regression guard
    // for the PRODUCT.md capability matrix).
    const forbidden = [
      "conti.emit",
      "conti.saldo",
      "users.approve",
      "users.read.all",
      "roles.manage",
      "roles.assign",
      "allowlist.manage",
      "audit.read",
      "activity_types.manage",
      "activities.delete.any",
      "activities.update.any",
      "trash.purge",
    ];
    for (const c of forbidden) expect(has(VETERINARIO_CAPS, c)).toBe(false);
  });

  it("grants titolare only billing caps over the base, no admin caps", () => {
    expect(has(TITOLARE_CAPS, "conti.emit")).toBe(true);
    expect(has(TITOLARE_CAPS, "conti.saldo")).toBe(true);
    for (const c of [
      "users.approve",
      "roles.manage",
      "allowlist.manage",
      "audit.read",
      "activity_types.manage",
    ]) {
      expect(has(TITOLARE_CAPS, c)).toBe(false);
    }
  });

  it("grants amministratore the admin capabilities", () => {
    for (const c of [
      "users.approve",
      "users.read.all",
      "roles.read",
      "roles.manage",
      "roles.assign",
      "allowlist.read",
      "allowlist.manage",
      "audit.read",
      "activity_types.manage",
    ]) {
      expect(has(AMMINISTRATORE_CAPS, c)).toBe(true);
    }
  });

  it("maps each product role in ROLE_BUNDLES to its bundle", () => {
    const byId = new Map(ROLE_BUNDLES.map((b) => [b.id, b.caps]));
    expect(byId.get("veterinario_semplice")).toBe(VETERINARIO_CAPS);
    expect(byId.get("titolare")).toBe(TITOLARE_CAPS);
    expect(byId.get("amministratore")).toBe(AMMINISTRATORE_CAPS);
  });
});
