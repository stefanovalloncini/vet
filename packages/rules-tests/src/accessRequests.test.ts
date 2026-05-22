import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { authedAs } from "./helpers";

describe("accessRequests rules", () => {
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

  async function seedRequest(): Promise<void> {
    const env = await getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "accessRequests/intruder@x.com"), {
        emailNorm: "intruder@x.com",
        email: "Intruder@X.com",
        firstAttemptAt: new Date(),
        lastAttemptAt: new Date(),
        attempts: 1,
        schemaVersion: 1,
      });
    });
  }

  it("denies read for an unauthenticated user", async () => {
    const env = await getEnv();
    await seedRequest();
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "accessRequests/intruder@x.com")));
  });

  it("denies read for a user without allowlist.manage", async () => {
    const env = await getEnv();
    await seedRequest();
    await assertFails(
      getDoc(doc(authedAs(env, "u"), "accessRequests/intruder@x.com"))
    );
    await assertFails(
      getDoc(doc(authedAs(env, "u", ["allowlist.read"]), "accessRequests/intruder@x.com"))
    );
  });

  it("allows read for a user with allowlist.manage", async () => {
    const env = await getEnv();
    await seedRequest();
    await assertSucceeds(
      getDoc(doc(authedAs(env, "u", ["allowlist.manage"]), "accessRequests/intruder@x.com"))
    );
    await assertSucceeds(
      getDocs(collection(authedAs(env, "u", ["allowlist.manage"]), "accessRequests"))
    );
  });

  it("denies all client writes even with allowlist.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["allowlist.manage"]);
    await assertFails(
      setDoc(doc(db, "accessRequests/forged@x.com"), {
        emailNorm: "forged@x.com",
        email: "forged@x.com",
        firstAttemptAt: new Date(),
        lastAttemptAt: new Date(),
        attempts: 1,
        schemaVersion: 1,
      })
    );
    await seedRequest();
    await assertFails(deleteDoc(doc(db, "accessRequests/intruder@x.com")));
  });
});
