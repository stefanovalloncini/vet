import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { authedAs } from "./helpers";

function validConto(extra: Record<string, unknown> = {}) {
  return {
    aziendaId: "az1",
    aziendaNome: "Cascina",
    periodoFrom: new Date("2026-01-01T00:00:00Z"),
    periodoTo: new Date("2026-03-31T23:59:59Z"),
    attivitaIds: ["a1", "a2"],
    totaleConto: 250,
    modalita: "proforma",
    saldato: false,
    emittedAt: serverTimestamp(),
    emittedBy: "u",
    emittedByName: "U",
    isDeleted: false,
    schemaVersion: 1,
    ...extra,
  };
}

describe("conti rules — armadiettoImporto", () => {
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

  it("create allowed with a valid armadiettoImporto", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["conti.proforma"]);
    await assertSucceeds(
      setDoc(doc(db, "conti/new"), validConto({ armadiettoImporto: 200 }))
    );
  });

  it("create allowed without armadiettoImporto (optional)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["conti.proforma"]);
    await assertSucceeds(setDoc(doc(db, "conti/new"), validConto()));
  });

  it("create denied with a negative armadiettoImporto", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["conti.proforma"]);
    await assertFails(
      setDoc(doc(db, "conti/new"), validConto({ armadiettoImporto: -1 }))
    );
  });

  it("create denied with armadiettoImporto over the cap", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["conti.proforma"]);
    await assertFails(
      setDoc(doc(db, "conti/new"), validConto({ armadiettoImporto: 100001 }))
    );
  });

  it("create denied with a non-number armadiettoImporto", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["conti.proforma"]);
    await assertFails(
      setDoc(doc(db, "conti/new"), validConto({ armadiettoImporto: "200" }))
    );
  });
});
