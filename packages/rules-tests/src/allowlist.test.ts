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
        schemaVersion: 1,
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
        schemaVersion: 1,
      })
    );
    await assertFails(
      setDoc(doc(db, "allowlist/badtime@x.com"), {
        email: "badtime@x.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: new Date(0),
        schemaVersion: 1,
      })
    );
  });

  it("create denied with oversized notes", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertFails(
      setDoc(doc(db, "allowlist/big@x.com"), {
        email: "big@x.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: serverTimestamp(),
        notes: "x".repeat(501),
        schemaVersion: 1,
      })
    );
  });

  it("create denied with unknown extra field", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertFails(
      setDoc(doc(db, "allowlist/extra@x.com"), {
        email: "extra@x.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: serverTimestamp(),
        schemaVersion: 1,
        attacker: "pwn",
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
        schemaVersion: 1,
      });
    });
    await assertFails(deleteDoc(doc(authedAs(env, "u"), "allowlist/d@x.com")));
    await assertSucceeds(deleteDoc(doc(adminAs(env, "admin"), "allowlist/d@x.com")));
  });

  it("create denied when email field mismatches document id", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertFails(
      setDoc(doc(db, "allowlist/alice@x.com"), {
        email: "bob@x.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: serverTimestamp(),
        schemaVersion: 1,
      })
    );
  });

  it("create allowed when email is mixed-case but normalizes to doc id", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertSucceeds(
      setDoc(doc(db, "allowlist/case@x.com"), {
        email: "Case@x.com",
        defaultRoleId: "vet",
        invitedBy: "admin",
        invitedAt: serverTimestamp(),
        schemaVersion: 1,
      })
    );
  });
});
