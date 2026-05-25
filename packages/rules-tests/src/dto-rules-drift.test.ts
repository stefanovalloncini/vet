import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
  type FieldValue,
} from "firebase/firestore";
import {
  buildActivityTypeCreateDoc,
  buildAllowlistEntryAddDoc,
  buildAttivitaCreateDoc,
  buildAziendaCreateDoc,
  buildContoEmitDoc,
  buildReminderCreateDoc,
  buildRoleCreateDoc,
  normalizeEmail,
  type ActorContext,
  type SerializerStampDeps,
} from "@vet/shared";
import { disposeEnv, getEnv } from "./setup";
import { authedAs } from "./helpers";

const stampDeps: SerializerStampDeps<Timestamp, FieldValue> = {
  fromDate: (d) => Timestamp.fromDate(d),
  serverTimestamp: () => serverTimestamp(),
};

const actor: ActorContext = {
  uid: "u",
  email: "u@example.com",
  displayName: "U",
  roleId: "vet",
  caps: new Set(),
  approved: true,
};

describe("DTO ↔ rules drift", () => {
  beforeAll(async () => {
    await getEnv();
  });
  afterAll(async () => {
    await disposeEnv();
  });
  beforeEach(async () => {
    const env = await getEnv();
    await env.clearFirestore();
  });

  it("azienda: schema fixture is accepted by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.create"]);
    const payload = buildAziendaCreateDoc(
      { input: { nome: "Cascina Verdi" }, actor },
      stampDeps
    );
    await assertSucceeds(setDoc(doc(db, "aziende/test1"), payload));
  });

  it("azienda: schema fixture + extra unknown field is rejected by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.create"]);
    const payload = buildAziendaCreateDoc(
      { input: { nome: "Cascina Verdi" }, actor },
      stampDeps
    );
    await assertFails(
      setDoc(doc(db, "aziende/test1"), { ...payload, drift: "extra" })
    );
  });

  it("attivita: schema fixture is accepted by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    const payload = buildAttivitaCreateDoc(
      {
        input: {
          data: new Date("2026-03-02T09:00:00.000Z"),
          aziendaId: "az1",
          tipoId: "visita",
          oraria: false,
          adElemento: false,
          tariffa: 50,
        },
        denorm: { aziendaNome: "Cascina", tipoNome: "Visita" },
        actor,
      },
      stampDeps
    );
    await assertSucceeds(setDoc(doc(db, "attivita/test1"), payload));
  });

  it("attivita: schema fixture + extra unknown field is rejected by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    const payload = buildAttivitaCreateDoc(
      {
        input: {
          data: new Date("2026-03-02T09:00:00.000Z"),
          aziendaId: "az1",
          tipoId: "visita",
          oraria: false,
          adElemento: false,
          tariffa: 50,
        },
        denorm: { aziendaNome: "Cascina", tipoNome: "Visita" },
        actor,
      },
      stampDeps
    );
    await assertFails(
      setDoc(doc(db, "attivita/test1"), { ...payload, drift: "extra" })
    );
  });

  it("conto: schema fixture is accepted by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["conti.proforma", "conti.emit"]);
    const payload = buildContoEmitDoc(
      {
        input: {
          aziendaId: "az1",
          periodoFrom: new Date("2026-01-01T00:00:00Z"),
          periodoTo: new Date("2026-01-31T23:59:59Z"),
          modalita: "emesso",
        },
        denorm: {
          aziendaNome: "Cascina Verdi",
          attivitaIds: ["a1", "a2"],
          totaleConto: 100,
        },
        actor,
      },
      stampDeps
    );
    await assertSucceeds(setDoc(doc(db, "conti/test1"), payload));
  });

  it("conto: schema fixture + extra unknown field is rejected by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["conti.proforma", "conti.emit"]);
    const payload = buildContoEmitDoc(
      {
        input: {
          aziendaId: "az1",
          periodoFrom: new Date("2026-01-01T00:00:00Z"),
          periodoTo: new Date("2026-01-31T23:59:59Z"),
          modalita: "emesso",
        },
        denorm: {
          aziendaNome: "Cascina Verdi",
          attivitaIds: ["a1", "a2"],
          totaleConto: 100,
        },
        actor,
      },
      stampDeps
    );
    await assertFails(
      setDoc(doc(db, "conti/test1"), { ...payload, drift: "extra" })
    );
  });

  it("reminder: schema fixture is accepted by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["reminders.create"]);
    const payload = buildReminderCreateDoc(
      {
        input: {
          aziendaId: "az1",
          titolo: "Visita follow-up",
          dueAt: new Date("2026-04-15T08:00:00Z"),
        },
        denorm: { aziendaNome: "Cascina Verdi" },
        actor,
      },
      stampDeps
    );
    await assertSucceeds(setDoc(doc(db, "reminders/test1"), payload));
  });

  it("reminder: schema fixture + extra unknown field is rejected by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["reminders.create"]);
    const payload = buildReminderCreateDoc(
      {
        input: {
          aziendaId: "az1",
          titolo: "Visita follow-up",
          dueAt: new Date("2026-04-15T08:00:00Z"),
        },
        denorm: { aziendaNome: "Cascina Verdi" },
        actor,
      },
      stampDeps
    );
    await assertFails(
      setDoc(doc(db, "reminders/test1"), { ...payload, drift: "extra" })
    );
  });

  it("allowlist: schema fixture is accepted by rules with allowlist.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["allowlist.manage"]);
    const payload = buildAllowlistEntryAddDoc(
      { input: { email: "guest@example.com", defaultRoleId: "vet" }, actor: "u" },
      stampDeps
    );
    const norm = normalizeEmail("guest@example.com");
    await assertSucceeds(setDoc(doc(db, `allowlist/${norm}`), payload));
  });

  it("allowlist: schema fixture + extra unknown field is rejected by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["allowlist.manage"]);
    const payload = buildAllowlistEntryAddDoc(
      { input: { email: "guest@example.com", defaultRoleId: "vet" }, actor: "u" },
      stampDeps
    );
    const norm = normalizeEmail("guest@example.com");
    await assertFails(
      setDoc(doc(db, `allowlist/${norm}`), { ...payload, drift: "extra" })
    );
  });

  it("role: schema fixture is accepted by rules with roles.manage", async () => {
    const env = await getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "roleNames/veterinario"), {
        roleId: "vetTest",
      });
    });
    const db = authedAs(env, "u", ["roles.manage"]);
    const payload = buildRoleCreateDoc(
      {
        input: {
          name: "Veterinario",
          capabilities: ["activities.read.all"],
        },
        actor: "u",
      },
      stampDeps
    );
    await assertSucceeds(setDoc(doc(db, "roles/vetTest"), payload));
  });

  it("role: schema fixture + extra unknown field is rejected by rules", async () => {
    const env = await getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "roleNames/veterinario"), {
        roleId: "vetTest",
      });
    });
    const db = authedAs(env, "u", ["roles.manage"]);
    const payload = buildRoleCreateDoc(
      {
        input: {
          name: "Veterinario",
          capabilities: ["activities.read.all"],
        },
        actor: "u",
      },
      stampDeps
    );
    await assertFails(
      setDoc(doc(db, "roles/vetTest"), { ...payload, drift: "extra" })
    );
  });

  it("activityType: schema fixture is accepted by rules with activity_types.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.manage"]);
    const payload = buildActivityTypeCreateDoc(
      {
        input: { nome: "Visita", ordine: 1, attivo: true },
      },
      stampDeps
    );
    await assertSucceeds(setDoc(doc(db, "activity_types/visita"), payload));
  });

  it("activityType: schema fixture + extra unknown field is rejected by rules", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.manage"]);
    const payload = buildActivityTypeCreateDoc(
      {
        input: { nome: "Visita", ordine: 1, attivo: true },
      },
      stampDeps
    );
    await assertFails(
      setDoc(doc(db, "activity_types/visita"), { ...payload, drift: "extra" })
    );
  });
});
