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

const tipoSeed = {
  nome: "Visita",
  ordine: 10,
  attivo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  schemaVersion: 1,
};

describe("activity_types rules", () => {
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
      await setDoc(doc(ctx.firestore(), "activity_types/visita"), tipoSeed);
    });
  });

  it("read denied without activity_types.read", async () => {
    const env = await getEnv();
    await assertFails(
      getDoc(doc(authedAs(env, "u"), "activity_types/visita"))
    );
  });

  it("read allowed with activity_types.read", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDoc(
        doc(
          authedAs(env, "u", ["activity_types.read"]),
          "activity_types/visita"
        )
      )
    );
  });

  it("create denied without activity_types.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.read"]);
    await assertFails(
      setDoc(doc(db, "activity_types/nuovo"), {
        nome: "Nuovo",
        ordine: 100,
        attivo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        schemaVersion: 1,
      })
    );
  });

  it("create allowed with activity_types.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.manage"]);
    await assertSucceeds(
      setDoc(doc(db, "activity_types/nuovo"), {
        nome: "Nuovo",
        ordine: 100,
        attivo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        schemaVersion: 1,
      })
    );
  });

  it("create denied when audit fields not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.manage"]);
    await assertFails(
      setDoc(doc(db, "activity_types/nuovo"), {
        nome: "Nuovo",
        ordine: 100,
        attivo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        schemaVersion: 1,
      })
    );
  });

  it("update denied without activity_types.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.read"]);
    await assertFails(
      updateDoc(doc(db, "activity_types/visita"), {
        nome: "Visita rinominata",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update allowed with activity_types.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.manage"]);
    await assertSucceeds(
      updateDoc(doc(db, "activity_types/visita"), {
        nome: "Visita rinominata",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when createdAt is changed", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.manage"]);
    await assertFails(
      updateDoc(doc(db, "activity_types/visita"), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("delete allowed with activity_types.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.manage"]);
    await assertSucceeds(deleteDoc(doc(db, "activity_types/visita")));
  });

  it("delete denied without activity_types.manage", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activity_types.read"]);
    await assertFails(deleteDoc(doc(db, "activity_types/visita")));
  });

  describe("tariffaStandard bounds (regression: client reported 1000 minimum bug)", () => {
    const baseCreate = (tariffaStandard: number) => ({
      nome: "Nuovo",
      ordine: 100,
      attivo: true,
      tariffaStandard,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      schemaVersion: 1,
    });

    it("create allowed with tariffaStandard 0", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activity_types.manage"]);
      await assertSucceeds(setDoc(doc(db, "activity_types/t0"), baseCreate(0)));
    });

    it("create allowed with tariffaStandard 999", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activity_types.manage"]);
      await assertSucceeds(
        setDoc(doc(db, "activity_types/t999"), baseCreate(999))
      );
    });

    it("create allowed with tariffaStandard 100000 (upper bound)", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activity_types.manage"]);
      await assertSucceeds(
        setDoc(doc(db, "activity_types/tmax"), baseCreate(100000))
      );
    });

    it("create denied with negative tariffaStandard", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activity_types.manage"]);
      await assertFails(
        setDoc(doc(db, "activity_types/tneg"), baseCreate(-1))
      );
    });

    it("create denied with tariffaStandard above 100000", async () => {
      const env = await getEnv();
      const db = authedAs(env, "u", ["activity_types.manage"]);
      await assertFails(
        setDoc(doc(db, "activity_types/tover"), baseCreate(100001))
      );
    });
  });
});
