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
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { authedAs } from "./helpers";

const ownerSeed = {
  aziendaId: "az1",
  aziendaNome: "Cascina San Marco",
  titolo: "Richiamo vaccinazione",
  dueAt: new Date("2026-06-01T09:00:00.000Z"),
  done: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "owner-uid",
  schemaVersion: 1,
};

function createPayload(createdBy: string, overrides: Record<string, unknown> = {}) {
  return {
    aziendaId: "az1",
    aziendaNome: "Cascina San Marco",
    titolo: "Richiamo vaccinazione",
    dueAt: new Date("2026-06-01T09:00:00.000Z"),
    done: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
    schemaVersion: 1,
    ...overrides,
  };
}

describe("reminders rules", () => {
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
      await setDoc(doc(ctx.firestore(), "reminders/r1"), ownerSeed);
    });
  });

  it("read denied without reminders.read", async () => {
    const env = await getEnv();
    await assertFails(getDoc(doc(authedAs(env, "u"), "reminders/r1")));
  });

  it("read allowed with reminders.read", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDoc(doc(authedAs(env, "u", ["reminders.read"]), "reminders/r1"))
    );
  });

  it("list denied without reminders.read", async () => {
    const env = await getEnv();
    await assertFails(
      getDocs(
        query(collection(authedAs(env, "u"), "reminders"), orderBy("dueAt", "asc"))
      )
    );
  });

  it("list allowed with reminders.read", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDocs(
        query(
          collection(authedAs(env, "u", ["reminders.read"]), "reminders"),
          orderBy("dueAt", "asc")
        )
      )
    );
  });

  it("list filtered by done=false allowed with reminders.read", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDocs(
        query(
          collection(authedAs(env, "u", ["reminders.read"]), "reminders"),
          where("done", "==", false),
          orderBy("dueAt", "asc")
        )
      )
    );
  });

  it("create denied without reminders.create", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["reminders.read"]);
    await assertFails(setDoc(doc(db, "reminders/new"), createPayload("u")));
  });

  it("create allowed with reminders.create + server-stamped audit + createdBy=self", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["reminders.create"]);
    await assertSucceeds(setDoc(doc(db, "reminders/new"), createPayload("u")));
  });

  it("create denied when createdBy != auth.uid (forgery)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["reminders.create"]);
    await assertFails(
      setDoc(doc(db, "reminders/new"), createPayload("someone-else"))
    );
  });

  it("create denied when done=true (must start open)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["reminders.create"]);
    await assertFails(
      setDoc(doc(db, "reminders/new"), createPayload("u", { done: true }))
    );
  });

  it("create denied when createdAt is not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["reminders.create"]);
    await assertFails(
      setDoc(
        doc(db, "reminders/new"),
        createPayload("u", { createdAt: new Date() })
      )
    );
  });

  it("create denied when updatedAt is not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["reminders.create"]);
    await assertFails(
      setDoc(
        doc(db, "reminders/new"),
        createPayload("u", { updatedAt: new Date() })
      )
    );
  });

  it("update own (toggle done) allowed with reminders.update.own", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["reminders.update.own"]);
    await assertSucceeds(
      updateDoc(doc(db, "reminders/r1"), {
        done: true,
        doneAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update own (mark not done) allowed with reminders.update.own", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["reminders.update.own"]);
    await assertSucceeds(
      updateDoc(doc(db, "reminders/r1"), {
        done: false,
        doneAt: null,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update other's denied with reminders.update.own", async () => {
    const env = await getEnv();
    const db = authedAs(env, "other-uid", ["reminders.update.own"]);
    await assertFails(
      updateDoc(doc(db, "reminders/r1"), {
        done: true,
        doneAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update other's allowed with reminders.update.any", async () => {
    const env = await getEnv();
    const db = authedAs(env, "other-uid", ["reminders.update.any"]);
    await assertSucceeds(
      updateDoc(doc(db, "reminders/r1"), {
        done: true,
        doneAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when createdBy is changed", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["reminders.update.own"]);
    await assertFails(
      updateDoc(doc(db, "reminders/r1"), {
        createdBy: "other-uid",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when createdAt is changed", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["reminders.update.own"]);
    await assertFails(
      updateDoc(doc(db, "reminders/r1"), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when updatedAt is not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["reminders.update.own"]);
    await assertFails(
      updateDoc(doc(db, "reminders/r1"), {
        done: true,
        updatedAt: new Date(),
      })
    );
  });

  it("delete own allowed with reminders.delete.own", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["reminders.delete.own"]);
    await assertSucceeds(deleteDoc(doc(db, "reminders/r1")));
  });

  it("delete other's denied with reminders.delete.own", async () => {
    const env = await getEnv();
    const db = authedAs(env, "other-uid", ["reminders.delete.own"]);
    await assertFails(deleteDoc(doc(db, "reminders/r1")));
  });

  it("delete other's allowed with reminders.delete.any", async () => {
    const env = await getEnv();
    const db = authedAs(env, "other-uid", ["reminders.delete.any"]);
    await assertSucceeds(deleteDoc(doc(db, "reminders/r1")));
  });

  it("delete denied without delete caps", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", [
      "reminders.read",
      "reminders.create",
      "reminders.update.own",
    ]);
    await assertFails(deleteDoc(doc(db, "reminders/r1")));
  });

  it("update denied when done=false but doneAt is a timestamp", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["reminders.update.own"]);
    await assertFails(
      updateDoc(doc(db, "reminders/r1"), {
        done: false,
        doneAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when done=true but doneAt is null", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["reminders.update.own"]);
    await assertFails(
      updateDoc(doc(db, "reminders/r1"), {
        done: true,
        doneAt: null,
        updatedAt: serverTimestamp(),
      })
    );
  });
});
