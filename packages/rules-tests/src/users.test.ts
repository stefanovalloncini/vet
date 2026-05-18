import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { adminAs, authedAs } from "./helpers";

describe("users rules", () => {
  beforeAll(async () => { await getEnv(); });
  afterAll(async () => { await disposeEnv(); });

  beforeEach(async () => {
    const env = await getEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "users/uid-1"), {
        email: "a@b.com",
        displayName: "A",
        roleId: "vet",
        disabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 1,
      });
    });
  });

  it("self can read own document", async () => {
    const env = await getEnv();
    const db = authedAs(env, "uid-1");
    await assertSucceeds(getDoc(doc(db, "users/uid-1")));
  });

  it("user without users.read.all cannot read other users", async () => {
    const env = await getEnv();
    const db = authedAs(env, "uid-2");
    await assertFails(getDoc(doc(db, "users/uid-1")));
  });

  it("admin can read any user", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertSucceeds(getDoc(doc(db, "users/uid-1")));
  });

  it("self can update displayName but not email", async () => {
    const env = await getEnv();
    const db = authedAs(env, "uid-1");
    await assertSucceeds(
      updateDoc(doc(db, "users/uid-1"), {
        displayName: "B",
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      updateDoc(doc(db, "users/uid-1"), {
        email: "evil@x.com",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("user without vet claim cannot read", async () => {
    const env = await getEnv();
    const db = env.authenticatedContext("uid-1", {}).firestore();
    await assertFails(getDoc(doc(db, "users/uid-1")));
  });
});
