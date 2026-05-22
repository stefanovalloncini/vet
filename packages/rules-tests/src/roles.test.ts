import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { adminAs, authedAs } from "./helpers";

const seedRole = {
  name: "Test",
  capabilities: ["activities.read.all"],
  locked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "seed",
  updatedBy: "seed",
  schemaVersion: 1,
};
const seedAdminRole = { ...seedRole, name: "admin", locked: true };

describe("roles rules", () => {
  beforeAll(async () => { await getEnv(); });
  afterAll(async () => { await disposeEnv(); });

  beforeEach(async () => {
    const env = await getEnv();
    await env.clearFirestore();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "roles/vet"), seedRole);
      await setDoc(doc(db, "roles/admin"), seedAdminRole);
    });
  });

  it("read requires roles.read", async () => {
    const env = await getEnv();
    await assertFails(getDoc(doc(authedAs(env, "u"), "roles/vet")));
    await assertSucceeds(getDoc(doc(authedAs(env, "u", ["roles.read"]), "roles/vet")));
  });

  it("create requires roles.manage and locked=false", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin-uid");
    await assertSucceeds(
      setDoc(doc(db, "roles/newrole"), {
        name: "New",
        capabilities: ["aziende.read"],
        locked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "admin-uid",
        updatedBy: "admin-uid",
        schemaVersion: 1,
      })
    );
    await assertFails(
      setDoc(doc(db, "roles/locked"), {
        name: "Locked",
        capabilities: [],
        locked: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "admin-uid",
        updatedBy: "admin-uid",
        schemaVersion: 1,
      })
    );
  });

  it("update on locked role is denied even for admin", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin-uid");
    await assertFails(
      updateDoc(doc(db, "roles/admin"), {
        name: "Hacked",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("delete on locked role is denied", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin-uid");
    await assertFails(deleteDoc(doc(db, "roles/admin")));
  });

  it("create denied when createdBy or updatedBy != auth.uid", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin-uid");
    await assertFails(
      setDoc(doc(db, "roles/spoofed"), {
        name: "Spoofed",
        capabilities: [],
        locked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "someone-else",
        updatedBy: "admin-uid",
        schemaVersion: 1,
      })
    );
    await assertFails(
      setDoc(doc(db, "roles/spoofed2"), {
        name: "Spoofed",
        capabilities: [],
        locked: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "admin-uid",
        updatedBy: "someone-else",
        schemaVersion: 1,
      })
    );
  });

  it("update denied when updatedBy != auth.uid", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin-uid");
    await assertFails(
      updateDoc(doc(db, "roles/vet"), {
        name: "Renamed",
        updatedBy: "someone-else",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update allowed when updatedBy = auth.uid", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin-uid");
    await assertSucceeds(
      updateDoc(doc(db, "roles/vet"), {
        name: "Renamed",
        updatedBy: "admin-uid",
        updatedAt: serverTimestamp(),
      })
    );
  });
});
