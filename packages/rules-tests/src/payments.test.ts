import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { authedAs } from "./helpers";

const paymentSeed = {
  aziendaId: "az1",
  aziendaNome: "Cascina",
  periodoFinoA: new Date("2026-05-31T00:00:00.000Z"),
  importoPagato: 1500,
  metodoPagamento: "bonifico",
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "creator-uid",
  updatedBy: "creator-uid",
  createdByName: "Creator",
  updatedByName: "Creator",
  schemaVersion: 1,
};

function basePayload(createdBy: string, overrides: Record<string, unknown> = {}) {
  return {
    aziendaId: "az1",
    aziendaNome: "Cascina",
    periodoFinoA: new Date("2026-05-31T00:00:00.000Z"),
    importoPagato: 1500,
    metodoPagamento: "bonifico",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
    updatedBy: createdBy,
    createdByName: "Owner",
    updatedByName: "Owner",
    schemaVersion: 1,
    ...overrides,
  };
}

describe("payments rules", () => {
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
      await setDoc(doc(ctx.firestore(), "payments/p1"), paymentSeed);
    });
  });

  it("read denied without payments.read", async () => {
    const env = await getEnv();
    await assertFails(getDoc(doc(authedAs(env, "u"), "payments/p1")));
  });

  it("read allowed with payments.read", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDoc(doc(authedAs(env, "u", ["payments.read"]), "payments/p1"))
    );
  });

  it("create denied without payments.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["payments.read"]);
    await assertFails(setDoc(doc(db, "payments/new"), basePayload("owner-uid")));
  });

  it("create allowed with payments.manage and createdBy=self", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["payments.manage"]);
    await assertSucceeds(
      setDoc(doc(db, "payments/new"), basePayload("owner-uid"))
    );
  });

  it("create denied when createdBy != auth.uid (forgery)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["payments.manage"]);
    await assertFails(
      setDoc(doc(db, "payments/new"), basePayload("someone-else"))
    );
  });

  it("create denied when audit fields not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["payments.manage"]);
    await assertFails(
      setDoc(
        doc(db, "payments/new"),
        basePayload("owner-uid", {
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      )
    );
  });

  it("create denied with unknown extra field", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["payments.manage"]);
    await assertFails(
      setDoc(
        doc(db, "payments/new"),
        basePayload("owner-uid", { attacker: "pwn" })
      )
    );
  });

  it("create denied with oversize importoPagato", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["payments.manage"]);
    await assertFails(
      setDoc(
        doc(db, "payments/new"),
        basePayload("owner-uid", { importoPagato: 1_000_001 })
      )
    );
  });

  it("update is denied for everyone", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", [
      "payments.read",
      "payments.manage",
    ]);
    await assertFails(
      updateDoc(doc(db, "payments/p1"), {
        importoPagato: 9999,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("delete denied without payments.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["payments.read"]);
    await assertFails(deleteDoc(doc(db, "payments/p1")));
  });

  it("delete allowed with payments.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["payments.manage"]);
    await assertSucceeds(deleteDoc(doc(db, "payments/p1")));
  });
});
