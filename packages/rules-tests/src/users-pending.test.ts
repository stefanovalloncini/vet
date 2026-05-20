import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { adminAs, authedAs } from "./helpers";

describe("users — pending approval", () => {
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
      await setDoc(doc(db, "users/pending-1"), {
        email: "pending@x.com",
        displayName: "Pending",
        roleId: "vet",
        approved: false,
        disabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 1,
      });
      await setDoc(doc(db, "users/active-1"), {
        email: "active@x.com",
        displayName: "Active",
        roleId: "vet",
        approved: true,
        disabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 1,
      });
    });
  });

  it("pending user (no vet claim) can read own user doc", async () => {
    const env = await getEnv();
    const db = env.authenticatedContext("pending-1", {}).firestore();
    await assertSucceeds(getDoc(doc(db, "users/pending-1")));
  });

  it("pending user cannot read other users", async () => {
    const env = await getEnv();
    const db = env.authenticatedContext("pending-1", {}).firestore();
    await assertFails(getDoc(doc(db, "users/active-1")));
  });

  it("pending user cannot read attivita", async () => {
    const env = await getEnv();
    const db = env.authenticatedContext("pending-1", {}).firestore();
    await assertFails(getDocs(collection(db, "attivita")));
  });

  it("pending user cannot read aziende", async () => {
    const env = await getEnv();
    const db = env.authenticatedContext("pending-1", {}).firestore();
    await assertFails(getDocs(collection(db, "aziende")));
  });

  it("pending user cannot self-update displayName (no vet claim)", async () => {
    const env = await getEnv();
    const db = env.authenticatedContext("pending-1", {}).firestore();
    await assertFails(
      updateDoc(doc(db, "users/pending-1"), {
        displayName: "X",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("admin with users.approve can flip approved + set role in one update", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertSucceeds(
      updateDoc(doc(db, "users/pending-1"), {
        approved: true,
        roleId: "vet",
        approvedAt: serverTimestamp(),
        approvedBy: "admin",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("user without users.approve cannot flip approved", async () => {
    const env = await getEnv();
    const db = authedAs(env, "uid-x", ["roles.assign"]);
    await assertFails(
      updateDoc(doc(db, "users/pending-1"), {
        approved: true,
        roleId: "vet",
        approvedAt: serverTimestamp(),
        approvedBy: "uid-x",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("client deletion of user doc is denied even with admin caps (must use rejectUser callable)", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertFails(
      (await import("firebase/firestore")).deleteDoc(doc(db, "users/pending-1"))
    );
  });

  it("admin cannot spoof approvedBy with another uid", async () => {
    const env = await getEnv();
    const db = adminAs(env, "admin");
    await assertFails(
      updateDoc(doc(db, "users/pending-1"), {
        approved: true,
        roleId: "vet",
        approvedAt: serverTimestamp(),
        approvedBy: "someone-else",
        updatedAt: serverTimestamp(),
      })
    );
  });
});
