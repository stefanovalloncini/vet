import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { adminAs, authedAs } from "./helpers";

describe("allowlist rules", () => {
  beforeAll(async () => { await getEnv(); });
  afterAll(async () => { await disposeEnv(); });

  beforeEach(async () => {
    const env = await getEnv();
    await env.clearFirestore();
  });

  it("read requires allowlist.read", async () => {
    const env = await getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "allowlist/x@y.com"), {
        email: "x@y.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: new Date(),
      });
    });
    await assertFails(getDoc(doc(authedAs(env, "u"), "allowlist/x@y.com")));
    await assertSucceeds(
      getDoc(doc(authedAs(env, "u", ["allowlist.read"]), "allowlist/x@y.com"))
    );
  });

  it("create requires allowlist.manage and server-stamped invitedAt", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertSucceeds(
      setDoc(doc(db, "allowlist/new@x.com"), {
        email: "new@x.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: serverTimestamp(),
      })
    );
    await assertFails(
      setDoc(doc(db, "allowlist/badtime@x.com"), {
        email: "badtime@x.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: new Date(0),
      })
    );
  });

  it("delete requires allowlist.manage", async () => {
    const env = await getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "allowlist/d@x.com"), {
        email: "d@x.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: new Date(),
      });
    });
    await assertFails(deleteDoc(doc(authedAs(env, "u"), "allowlist/d@x.com")));
    await assertSucceeds(deleteDoc(doc(adminAs(env, "admin"), "allowlist/d@x.com")));
  });
});
