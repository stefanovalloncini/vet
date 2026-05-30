import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
} from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { adminAs, authedAs } from "./helpers";

describe("audit rules", () => {
  beforeAll(async () => { await getEnv(); });
  afterAll(async () => { await disposeEnv(); });

  beforeEach(async () => {
    const env = await getEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "audit/abc"), {
        at: new Date(),
        actorUid: "x",
        actorEmail: "x@y.com",
        action: "role.update",
        targetType: "role",
        targetId: "vet",
      });
    });
  });

  it("read requires audit.read", async () => {
    const env = await getEnv();
    await assertFails(getDoc(doc(authedAs(env, "u"), "audit/abc")));
    await assertSucceeds(
      getDoc(doc(authedAs(env, "u", ["audit.read"]), "audit/abc"))
    );
  });

  it("list allowed with audit.read and a within-cap limit", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["audit.read"]);
    await assertSucceeds(getDocs(query(collection(db, "audit"), limit(500))));
  });

  it("list denied without audit.read", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u");
    await assertFails(getDocs(query(collection(db, "audit"), limit(50))));
  });

  it("list denied without a query limit (unbounded read)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["audit.read"]);
    await assertFails(getDocs(query(collection(db, "audit"))));
  });

  it("list denied when the limit exceeds the cap", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["audit.read"]);
    await assertFails(getDocs(query(collection(db, "audit"), limit(501))));
  });

  it("client cannot write audit ever", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertFails(
      setDoc(doc(db, "audit/new"), {
        at: new Date(),
        actorUid: "admin",
        actorEmail: "admin@x.com",
        action: "test",
        targetType: "role",
        targetId: "x",
      })
    );
  });
});
