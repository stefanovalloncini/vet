import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { Capability } from "@vet/shared";
import { disposeEnv, getEnv } from "./setup";
import { authedAs } from "./helpers";

const PERIODO_FROM = new Date("2026-03-01T00:00:00.000Z");
const PERIODO_TO = new Date("2026-03-31T23:59:59.000Z");

function createPayload(emitter: string, overrides: Record<string, unknown> = {}) {
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
    emittedByName: "Owner",
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  };
}

function emessoSeed(overrides: Record<string, unknown> = {}) {
  return {
    aziendaId: "az1",
    aziendaNome: "Cascina San Marco",
    periodoFrom: new Date(PERIODO_FROM),
    periodoTo: new Date(PERIODO_TO),
    attivitaIds: ["a1", "a2"],
    totaleConto: 250,
    modalita: "emesso",
    saldato: false,
    emittedAt: new Date(),
    emittedBy: "owner-uid",
    emittedByName: "Owner",
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  };
}

const READ: Capability[] = ["conti.proforma"];
const PROFORMA: Capability[] = ["conti.proforma"];
const EMIT: Capability[] = ["conti.proforma", "conti.emit"];
const SALDO: Capability[] = ["conti.proforma", "conti.saldo"];

describe("conti rules", () => {
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
      await setDoc(doc(db, "conti/emesso-aperto"), emessoSeed());
      await setDoc(
        doc(db, "conti/emesso-saldato"),
        emessoSeed({
          saldato: true,
          saldatoAt: new Date(),
          saldatoBy: "owner-uid",
          saldatoByName: "Owner",
        })
      );
      await setDoc(
        doc(db, "conti/emesso-annullato"),
        emessoSeed({ isDeleted: true, deletedAt: new Date(), deletedBy: "owner-uid" })
      );
      await setDoc(doc(db, "conti/proforma-aperto"), emessoSeed({ modalita: "proforma" }));
    });
  });

  describe("read", () => {
    it("denied without conti.proforma", async () => {
      const env = await getEnv();
      await assertFails(getDoc(doc(authedAs(env, "u"), "conti/emesso-aperto")));
    });

    it("allowed with conti.proforma", async () => {
      const env = await getEnv();
      await assertSucceeds(
        getDoc(doc(authedAs(env, "u", READ), "conti/emesso-aperto"))
      );
    });

    it("list denied without conti.proforma", async () => {
      const env = await getEnv();
      await assertFails(getDocs(collection(authedAs(env, "u"), "conti")));
    });

    it("list allowed with conti.proforma", async () => {
      const env = await getEnv();
      await assertSucceeds(
        getDocs(collection(authedAs(env, "u", READ), "conti"))
      );
    });
  });

  describe("create", () => {
    it("denied without conti.proforma", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", []);
      await assertFails(setDoc(doc(db, "conti/new"), createPayload("owner-uid")));
    });

    it("proforma allowed with conti.proforma + self emitter + server-stamped + token name", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertSucceeds(setDoc(doc(db, "conti/new"), createPayload("owner-uid")));
    });

    it("emesso denied with only conti.proforma (needs conti.emit)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(doc(db, "conti/new"), createPayload("owner-uid", { modalita: "emesso" }))
      );
    });

    it("emesso allowed with conti.emit", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", EMIT);
      await assertSucceeds(
        setDoc(doc(db, "conti/new"), createPayload("owner-uid", { modalita: "emesso" }))
      );
    });

    it("denied when emittedBy != auth.uid (forgery)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(doc(db, "conti/new"), createPayload("someone-else"))
      );
    });

    it("denied when emittedByName != token name (impersonation)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA, { name: "Owner" });
      await assertFails(
        setDoc(
          doc(db, "conti/new"),
          createPayload("owner-uid", { emittedByName: "Someone Else" })
        )
      );
    });

    it("denied when emittedByName starts with a CSV-injection char", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA, { name: "=cmd()" });
      await assertFails(
        setDoc(
          doc(db, "conti/new"),
          createPayload("owner-uid", { emittedByName: "=cmd()" })
        )
      );
    });

    it("denied when emittedAt is not server-stamped", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(
          doc(db, "conti/new"),
          createPayload("owner-uid", { emittedAt: new Date() })
        )
      );
    });

    it("denied when saldato starts as true", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(doc(db, "conti/new"), createPayload("owner-uid", { saldato: true }))
      );
    });

    it("denied when isDeleted starts as true", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(doc(db, "conti/new"), createPayload("owner-uid", { isDeleted: true }))
      );
    });

    it("denied when totaleConto is negative", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(doc(db, "conti/new"), createPayload("owner-uid", { totaleConto: -1 }))
      );
    });

    it("denied when totaleConto exceeds the cap", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(
          doc(db, "conti/new"),
          createPayload("owner-uid", { totaleConto: 2_400_001 })
        )
      );
    });

    it("denied when modalita is not in the enum", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", EMIT);
      await assertFails(
        setDoc(doc(db, "conti/new"), createPayload("owner-uid", { modalita: "bozza" }))
      );
    });

    it("denied when aziendaNome exceeds the length cap", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(
          doc(db, "conti/new"),
          createPayload("owner-uid", { aziendaNome: "x".repeat(201) })
        )
      );
    });

    it("denied when an extra field is present", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(doc(db, "conti/new"), createPayload("owner-uid", { hacked: true }))
      );
    });

    it("denied when schemaVersion is wrong", async () => {
      const env = await getEnv();
      const db = authedAs(env, "owner-uid", PROFORMA);
      await assertFails(
        setDoc(doc(db, "conti/new"), createPayload("owner-uid", { schemaVersion: 2 }))
      );
    });
  });

  describe("saldo update", () => {
    it("allowed with conti.saldo on an open emesso conto", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertSucceeds(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
        })
      );
    });

    it("denied without conti.saldo", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", PROFORMA, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
        })
      );
    });

    it("denied on a proforma conto (only emesso can be saldato)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/proforma-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
        })
      );
    });

    it("denied on an already-saldato conto (no double settle)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-saldato"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
        })
      );
    });

    it("denied when saldatoBy != auth.uid", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "someone-else",
          saldatoByName: "Capo",
        })
      );
    });

    it("denied when saldatoByName != token name", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Imposter",
        })
      );
    });

    it("denied when saldatoAt is not server-stamped", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: new Date(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
        })
      );
    });

    it("denied when importoSaldato exceeds the cap", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
          importoSaldato: 1_000_001,
        })
      );
    });

    it("allowed with importoSaldato + metodoPagamento within bounds", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertSucceeds(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
          importoSaldato: 250,
          metodoPagamento: "bonifico",
        })
      );
    });

    it("denied with an unknown metodoPagamento", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
          metodoPagamento: "crypto",
        })
      );
    });

    it("denied when an immutable field (totaleConto) is changed", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          saldato: true,
          saldatoAt: serverTimestamp(),
          saldatoBy: "capo",
          saldatoByName: "Capo",
          totaleConto: 1,
        })
      );
    });
  });

  describe("annulla (soft-delete) update", () => {
    it("allowed with conti.emit", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", EMIT, { name: "Capo" });
      await assertSucceeds(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: "capo",
        })
      );
    });

    it("denied without conti.emit", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", SALDO, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: "capo",
        })
      );
    });

    it("denied on an already-annullato conto", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", EMIT, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-annullato"), {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: "capo",
        })
      );
    });

    it("denied when deletedBy != auth.uid", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", EMIT, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          isDeleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: "someone-else",
        })
      );
    });

    it("denied when deletedAt is not server-stamped", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", EMIT, { name: "Capo" });
      await assertFails(
        updateDoc(doc(db, "conti/emesso-aperto"), {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: "capo",
        })
      );
    });
  });

  describe("delete", () => {
    it("hard delete is always denied (annulla is soft-delete only)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "capo", [...EMIT, ...SALDO], { name: "Capo" });
      await assertFails(deleteDoc(doc(db, "conti/emesso-aperto")));
    });
  });
});
