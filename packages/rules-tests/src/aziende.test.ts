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

const aziendaSeed = {
  nome: "Cascina San Marco",
  nomeNorm: "cascina san marco",
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "owner-uid",
  updatedBy: "owner-uid",
  createdByName: "Stefano",
  updatedByName: "Stefano",
  isDeleted: false,
  schemaVersion: 1,
};

describe("aziende rules", () => {
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
      await setDoc(doc(ctx.firestore(), "aziende/a1"), aziendaSeed);
    });
  });

  it("read denied without aziende.read", async () => {
    const env = await getEnv();
    await assertFails(getDoc(doc(authedAs(env, "u"), "aziende/a1")));
  });

  it("read allowed with aziende.read", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDoc(doc(authedAs(env, "u", ["aziende.read"]), "aziende/a1"))
    );
  });

  it("create denied without aziende.create", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.read"]);
    await assertFails(
      setDoc(doc(db, "aziende/new"), {
        nome: "Nuova",
        nomeNorm: "nuova",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "u",
        updatedBy: "u",
        createdByName: "U",
        updatedByName: "U",
        isDeleted: false,
        schemaVersion: 1,
      })
    );
  });

  it("create allowed with aziende.create + server-stamped audit + createdBy=self", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.create"]);
    await assertSucceeds(
      setDoc(doc(db, "aziende/new"), {
        nome: "Nuova",
        nomeNorm: "nuova",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "u",
        updatedBy: "u",
        createdByName: "U",
        updatedByName: "U",
        isDeleted: false,
        schemaVersion: 1,
      })
    );
  });

  it("create denied when createdBy != auth.uid (forgery)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.create"]);
    await assertFails(
      setDoc(doc(db, "aziende/new"), {
        nome: "Nuova",
        nomeNorm: "nuova",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "someone-else",
        updatedBy: "u",
        createdByName: "U",
        updatedByName: "U",
        isDeleted: false,
        schemaVersion: 1,
      })
    );
  });

  it("create denied when isDeleted=true (must start active)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.create"]);
    await assertFails(
      setDoc(doc(db, "aziende/new"), {
        nome: "Nuova",
        nomeNorm: "nuova",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: "u",
        updatedBy: "u",
        createdByName: "U",
        updatedByName: "U",
        isDeleted: true,
        schemaVersion: 1,
      })
    );
  });

  it("create denied when audit fields not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.create"]);
    await assertFails(
      setDoc(doc(db, "aziende/new"), {
        nome: "Nuova",
        nomeNorm: "nuova",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "u",
        updatedBy: "u",
        createdByName: "U",
        updatedByName: "U",
        isDeleted: false,
        schemaVersion: 1,
      })
    );
  });

  it("update denied without aziende.update", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.read"]);
    await assertFails(
      updateDoc(doc(db, "aziende/a1"), {
        nome: "Renamed",
        nomeNorm: "renamed",
        updatedAt: serverTimestamp(),
        updatedBy: "u",
        updatedByName: "U",
      })
    );
  });

  it("update allowed with aziende.update", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.update"]);
    await assertSucceeds(
      updateDoc(doc(db, "aziende/a1"), {
        nome: "Renamed",
        nomeNorm: "renamed",
        updatedAt: serverTimestamp(),
        updatedBy: "u",
        updatedByName: "U",
      })
    );
  });

  it("update denied when createdAt is changed", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.update"]);
    await assertFails(
      updateDoc(doc(db, "aziende/a1"), {
        nome: "Renamed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when createdBy is changed", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.update"]);
    await assertFails(
      updateDoc(doc(db, "aziende/a1"), {
        createdBy: "u",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when updatedAt is not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.update"]);
    await assertFails(
      updateDoc(doc(db, "aziende/a1"), {
        nome: "Renamed",
        updatedAt: new Date(),
      })
    );
  });

  it("soft delete (isDeleted=true) via update is allowed with aziende.update", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["aziende.update"]);
    await assertSucceeds(
      updateDoc(doc(db, "aziende/a1"), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: "u",
        updatedByName: "U",
      })
    );
  });

  it("hard delete denied for everyone", async () => {
    const env = await getEnv();
    const dbU = authedAs(env, "u", ["aziende.update"]);
    const dbAdmin = authedAs(env, "a", [
      "aziende.read",
      "aziende.create",
      "aziende.update",
    ]);
    await assertFails(deleteDoc(doc(dbU, "aziende/a1")));
    await assertFails(deleteDoc(doc(dbAdmin, "aziende/a1")));
  });
});
