import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { authedAs } from "./helpers";

describe("schema validation in rules", () => {
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

  function baseAttivita(overrides: Record<string, unknown> = {}) {
    return {
      data: Timestamp.fromDate(new Date("2026-03-02T09:00:00.000Z")),
      aziendaId: "az1",
      aziendaNome: "Cascina",
      tipoId: "visita",
      tipoNome: "Visita",
      oraria: false,
      adElemento: false,
      tariffa: 50,
      totale: 50,
      ownerUid: "u",
      ownerEmail: "u@example.com",
      ownerName: "U",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isDeleted: false,
      schemaVersion: 1,
      ...overrides,
    };
  }

  function baseAzienda(overrides: Record<string, unknown> = {}) {
    return {
      nome: "Nuova",
      nomeNorm: "nuova",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: "u",
      updatedBy: "u",
      createdByName: "U",
      updatedByName: "U",
      isDeleted: false,
      schemaVersion: 1,
      ...overrides,
    };
  }

  describe("attivita", () => {
    it("rejects extra unknown field", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ malicious: "x" }))
      );
    });
    it("rejects oversize note (>2000)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ note: "a".repeat(2001) }))
      );
    });
    it("accepts note at exactly 2000", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertSucceeds(
        setDoc(doc(db, "attivita/x"), baseAttivita({ note: "a".repeat(2000) }))
      );
    });
    it("rejects negative tariffa", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ tariffa: -1, totale: -1 }))
      );
    });
    it("rejects tariffa above 100000", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ tariffa: 100001, totale: 100001 }))
      );
    });
    it("rejects oraria=true without ore", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ oraria: true }))
      );
    });
    it("rejects oraria=false with ore present", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ oraria: false, ore: 2 }))
      );
    });
    it("accepts oraria=true with ore in range", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertSucceeds(
        setDoc(
          doc(db, "attivita/x"),
          baseAttivita({ oraria: true, ore: 2, totale: 100 })
        )
      );
    });
    it("rejects ore above 24", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(
          doc(db, "attivita/x"),
          baseAttivita({ oraria: true, ore: 25, totale: 100 })
        )
      );
    });
    it("rejects totale above 2400000", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ totale: 2400001 }))
      );
    });
    it("rejects ownerName starting with csv formula prefix =", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"], { name: "=evil" });
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ ownerName: "=evil" }))
      );
    });
    it("rejects wrong schemaVersion", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activities.create"]);
      await assertFails(
        setDoc(doc(db, "attivita/x"), baseAttivita({ schemaVersion: 2 }))
      );
    });
  });

  describe("aziende", () => {
    it("rejects extra unknown field", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertFails(
        setDoc(doc(db, "aziende/x"), baseAzienda({ malicious: "x" }))
      );
    });
    it("rejects oversize note (>1000)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertFails(
        setDoc(doc(db, "aziende/x"), baseAzienda({ note: "a".repeat(1001) }))
      );
    });
    it("rejects invalid PIVA format", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertFails(
        setDoc(doc(db, "aziende/x"), baseAzienda({ piva: "ABC" }))
      );
    });
    it("rejects unknown cadenzaFatturazione value", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertFails(
        setDoc(doc(db, "aziende/x"), baseAzienda({ cadenzaFatturazione: "biennale" }))
      );
    });
    it("accepts valid cadenzaFatturazione=monthly", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertSucceeds(
        setDoc(doc(db, "aziende/x"), baseAzienda({ cadenzaFatturazione: "monthly" }))
      );
    });
    it("rejects unknown tipoAllevamento", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertFails(
        setDoc(doc(db, "aziende/x"), baseAzienda({ tipoAllevamento: "aliens" }))
      );
    });
    it("rejects negative numeroCapi", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertFails(
        setDoc(doc(db, "aziende/x"), baseAzienda({ numeroCapi: -1 }))
      );
    });
    it("rejects invalid emailFatturazione", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertFails(
        setDoc(doc(db, "aziende/x"), baseAzienda({ emailFatturazione: "not-an-email" }))
      );
    });
    it("rejects oversize indirizzo (>300)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["aziende.create"]);
      await assertFails(
        setDoc(doc(db, "aziende/x"), baseAzienda({ indirizzo: "a".repeat(301) }))
      );
    });
  });
});
