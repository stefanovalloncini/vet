import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import {
  asAmministratore,
  asTitolare,
  asVeterinarioSemplice,
} from "./helpers";

const PERIODO_FROM = new Date("2026-03-01T00:00:00.000Z");
const PERIODO_TO = new Date("2026-03-31T23:59:59.000Z");

function contoPayload(emitter: string, overrides: Record<string, unknown> = {}) {
  return {
    aziendaId: "az1",
    aziendaNome: "Cascina San Marco",
    periodoFrom: Timestamp.fromDate(PERIODO_FROM),
    periodoTo: Timestamp.fromDate(PERIODO_TO),
    attivitaIds: ["a1", "a2"],
    totaleConto: 250,
    modalita: "proforma",
    saldato: false,
    emittedAt: serverTimestamp(),
    emittedBy: emitter,
    emittedByName: emitter,
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  };
}

function seedConto(modalita: "proforma" | "emesso") {
  return {
    aziendaId: "az1",
    aziendaNome: "Cascina San Marco",
    periodoFrom: new Date(PERIODO_FROM),
    periodoTo: new Date(PERIODO_TO),
    attivitaIds: ["a1", "a2"],
    totaleConto: 250,
    modalita,
    saldato: false,
    emittedAt: new Date(),
    emittedBy: "owner-uid",
    emittedByName: "Owner",
    isDeleted: false,
    schemaVersion: 1,
  };
}

describe("role spec — three-role authorization model", () => {
  beforeAll(async () => {
    await getEnv();
  });
  afterAll(async () => {
    await disposeEnv();
  });

  beforeEach(async () => {
    const env = await getEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "users/pending-1"), {
        email: "pending@example.com",
        displayName: "Pending",
        roleId: "veterinario_semplice",
        approved: false,
        disabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 1,
      });
      await setDoc(doc(db, "conti/emesso-aperto"), seedConto("emesso"));
      await setDoc(doc(db, "audit/abc"), {
        at: new Date(),
        actorUid: "x",
        actorEmail: "x@example.com",
        action: "role.update",
        targetType: "role",
        targetId: "titolare",
      });
    });
  });

  describe("veterinario_semplice", () => {
    it("cannot create a conto in modalita 'emesso'", async () => {
      const env = await getEnv();
      const db = asVeterinarioSemplice(env, "semplice");
      await assertFails(
        setDoc(
          doc(db, "conti/new-emesso"),
          contoPayload("semplice", { modalita: "emesso" })
        )
      );
    });

    it("can create a conto in modalita 'proforma'", async () => {
      const env = await getEnv();
      const db = asVeterinarioSemplice(env, "semplice");
      await assertSucceeds(
        setDoc(
          doc(db, "conti/new-proforma"),
          contoPayload("semplice", { modalita: "proforma" })
        )
      );
    });

    it("cannot mark a conto as saldato (no conti.saldo)", async () => {
      const env = await getEnv();
      const db = asVeterinarioSemplice(env, "semplice");
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "semplice",
          saldatoByName: "semplice",
        })
      );
    });

    it("cannot approve other users (no users.approve)", async () => {
      const env = await getEnv();
      const db = asVeterinarioSemplice(env, "semplice");
      await assertFails(
        updateDoc(doc(db, "users/pending-1"), {
          approved: true,
          roleId: "veterinario_semplice",
          approvedAt: serverTimestamp(),
          approvedBy: "semplice",
          updatedAt: serverTimestamp(),
        })
      );
    });

    it("cannot read the audit log (no audit.read)", async () => {
      const env = await getEnv();
      const db = asVeterinarioSemplice(env, "semplice");
      await assertFails(getDoc(doc(db, "audit/abc")));
    });
  });

  describe("titolare", () => {
    it("can create a conto in modalita 'proforma'", async () => {
      const env = await getEnv();
      const db = asTitolare(env, "capo");
      await assertSucceeds(
        setDoc(
          doc(db, "conti/capo-proforma"),
          contoPayload("capo", { modalita: "proforma" })
        )
      );
    });

    it("can create a conto in modalita 'emesso'", async () => {
      const env = await getEnv();
      const db = asTitolare(env, "capo");
      await assertSucceeds(
        setDoc(
          doc(db, "conti/capo-emesso"),
          contoPayload("capo", { modalita: "emesso" })
        )
      );
    });

    it("can mark a conto as saldato", async () => {
      const env = await getEnv();
      const db = asTitolare(env, "capo");
      await assertSucceeds(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "capo",
        })
      );
    });

    it("cannot approve other users (no users.approve)", async () => {
      const env = await getEnv();
      const db = asTitolare(env, "capo");
      await assertFails(
        updateDoc(doc(db, "users/pending-1"), {
          approved: true,
          roleId: "veterinario_semplice",
          approvedAt: serverTimestamp(),
          approvedBy: "capo",
          updatedAt: serverTimestamp(),
        })
      );
    });

    it("cannot read the audit log (no audit.read)", async () => {
      const env = await getEnv();
      const db = asTitolare(env, "capo");
      await assertFails(getDoc(doc(db, "audit/abc")));
    });
  });

  describe("amministratore", () => {
    it("can approve a pending user (flip approved + set roleId)", async () => {
      const env = await getEnv();
      const db = asAmministratore(env, "admin");
      await assertSucceeds(
        updateDoc(doc(db, "users/pending-1"), {
          approved: true,
          roleId: "veterinario_semplice",
          approvedAt: serverTimestamp(),
          approvedBy: "admin",
          updatedAt: serverTimestamp(),
        })
      );
    });

    it("can read the audit log", async () => {
      const env = await getEnv();
      const db = asAmministratore(env, "admin");
      await assertSucceeds(getDoc(doc(db, "audit/abc")));
    });

    it("can mark a conto as saldato", async () => {
      const env = await getEnv();
      const db = asAmministratore(env, "admin");
      await assertSucceeds(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "admin",
          saldatoByName: "Admin",
        })
      );
    });
  });
});
