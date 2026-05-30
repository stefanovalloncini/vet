import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
} from "firebase/firestore";
import { encodeCaps } from "@vet/shared";
import { disposeEnv, getEnv } from "./setup";
import { authedAs } from "./helpers";

const attivitaSeed = {
  data: new Date("2026-03-01T09:00:00.000Z"),
  aziendaId: "az1",
  aziendaNome: "Cascina",
  tipoId: "visita",
  tipoNome: "Visita",
  oraria: false,
  adElemento: false,
  tariffa: 50,
  totale: 50,
  ownerUid: "owner-uid",
  ownerEmail: "owner-uid@example.com",
  ownerName: "Owner",
  createdAt: new Date(),
  updatedAt: new Date(),
  isDeleted: false,
  schemaVersion: 1,
};

const USERS = {
  "u": { displayName: "U" },
  "owner-uid": { displayName: "Owner" },
  "other-uid": { displayName: "Other" },
};

function basePayload(ownerUid: string, overrides: Record<string, unknown> = {}) {
  return {
    data: new Date("2026-03-02T09:00:00.000Z"),
    aziendaId: "az1",
    aziendaNome: "Cascina",
    tipoId: "visita",
    tipoNome: "Visita",
    oraria: false,
    adElemento: false,
    tariffa: 50,
    totale: 50,
    ownerUid,
    ownerEmail: `${ownerUid}@example.com`,
    ownerName: USERS[ownerUid as keyof typeof USERS]?.displayName ?? "?",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
    schemaVersion: 1,
    ...overrides,
  };
}

describe("attivita rules", () => {
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
      for (const [uid, profile] of Object.entries(USERS)) {
        await setDoc(doc(db, `users/${uid}`), {
          email: `${uid}@example.com`,
          displayName: profile.displayName,
          roleId: "vet",
          disabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          schemaVersion: 1,
        });
      }
      await setDoc(doc(db, "attivita/a1"), attivitaSeed);
      await setDoc(doc(db, "attivita/del1"), {
        ...attivitaSeed,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: "owner-uid",
      });
    });
  });

  it("read active denied without activities.read.all", async () => {
    const env = await getEnv();
    await assertFails(getDoc(doc(authedAs(env, "u"), "attivita/a1")));
  });

  it("read active allowed with activities.read.all", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDoc(
        doc(authedAs(env, "u", ["activities.read.all"]), "attivita/a1")
      )
    );
  });

  it("read deleted denied with only activities.read.all", async () => {
    const env = await getEnv();
    await assertFails(
      getDoc(
        doc(authedAs(env, "u", ["activities.read.all"]), "attivita/del1")
      )
    );
  });

  it("read own deleted allowed with trash.read.own when owner", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDoc(
        doc(
          authedAs(env, "owner-uid", ["trash.read.own"]),
          "attivita/del1"
        )
      )
    );
  });

  it("read other's deleted denied with trash.read.own", async () => {
    const env = await getEnv();
    await assertFails(
      getDoc(
        doc(authedAs(env, "other-uid", ["trash.read.own"]), "attivita/del1")
      )
    );
  });

  it("read any deleted allowed with trash.read.any", async () => {
    const env = await getEnv();
    await assertSucceeds(
      getDoc(
        doc(authedAs(env, "other-uid", ["trash.read.any"]), "attivita/del1")
      )
    );
  });

  it("create denied without activities.create", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u");
    await assertFails(setDoc(doc(db, "attivita/new"), basePayload("u")));
  });

  it("create allowed with activities.create and ownerUid=self", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    await assertSucceeds(setDoc(doc(db, "attivita/new"), basePayload("u")));
  });

  it("create denied when adElemento is missing", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    const { adElemento: _omit, ...payload } = basePayload("u");
    await assertFails(setDoc(doc(db, "attivita/new"), payload));
  });

  it("create denied when ownerUid != auth.uid", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    await assertFails(
      setDoc(doc(db, "attivita/new"), basePayload("someone-else"))
    );
  });

  it("create denied when ownerEmail forged (mismatches auth.token.email)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    await assertFails(
      setDoc(
        doc(db, "attivita/new"),
        basePayload("u", { ownerEmail: "victim@vet.it" })
      )
    );
  });

  it("create denied when ownerName forged (mismatches users/{uid}.displayName)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    await assertFails(
      setDoc(
        doc(db, "attivita/new"),
        basePayload("u", { ownerName: "Mario Rossi" })
      )
    );
  });

  it("create denied when ownerName contains a csv formula prefix", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    await assertFails(
      setDoc(
        doc(db, "attivita/new"),
        basePayload("u", { ownerName: "=cmd|'/c calc'!A1" })
      )
    );
  });

  it("create denied when isDeleted=true", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    await assertFails(
      setDoc(doc(db, "attivita/new"), basePayload("u", { isDeleted: true }))
    );
  });

  it("create denied when audit fields not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "u", ["activities.create"]);
    await assertFails(
      setDoc(
        doc(db, "attivita/new"),
        basePayload("u", {
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      )
    );
  });

  it("update own allowed with activities.update.own", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertSucceeds(
      updateDoc(doc(db, "attivita/a1"), {
        tariffa: 60,
        totale: 60,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when adElemento is dropped (must stay present, like create)", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        adElemento: deleteField(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when oraria=true but ore is missing", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        oraria: true,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update allowed when switching to oraria with ore present", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertSucceeds(
      updateDoc(doc(db, "attivita/a1"), {
        oraria: true,
        ore: 2,
        totale: 100,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when oraria=true and elementi present", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        oraria: true,
        ore: 2,
        adElemento: true,
        elementi: 3,
        totale: 100,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when adElemento=true but elementi is missing", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        adElemento: true,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update other's denied with activities.update.own", async () => {
    const env = await getEnv();
    const db = authedAs(env, "other-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        tariffa: 60,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update other's allowed with activities.update.any", async () => {
    const env = await getEnv();
    const db = authedAs(env, "other-uid", ["activities.update.any"]);
    await assertSucceeds(
      updateDoc(doc(db, "attivita/a1"), {
        tariffa: 60,
        totale: 60,
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when ownerUid is changed", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        ownerUid: "other-uid",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when createdAt is changed", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("update denied when updatedAt is not server-stamped", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        tariffa: 60,
        updatedAt: new Date(),
      })
    );
  });

  it("soft delete via update isDeleted=true allowed with activities.delete.own when owner", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.delete.own"]);
    await assertSucceeds(
      updateDoc(doc(db, "attivita/a1"), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: "owner-uid",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("soft delete other's denied with activities.delete.own", async () => {
    const env = await getEnv();
    const db = authedAs(env, "other-uid", ["activities.delete.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: "other-uid",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("hard delete denied for everyone", async () => {
    const env = await getEnv();
    const owner = authedAs(env, "owner-uid", [
      "activities.update.own",
      "activities.delete.own",
      "activities.update.any",
      "activities.delete.any",
    ]);
    await assertFails(deleteDoc(doc(owner, "attivita/a1")));
  });

  it("create denied when token lacks name claim", async () => {
    const env = await getEnv();
    const db = env
      .authenticatedContext("u", {
        vet: true,
        caps: encodeCaps(["activities.create"]),
        roleId: "vet",
        capsVer: 1,
        email: "u@example.com",
      })
      .firestore();
    await assertFails(setDoc(doc(db, "attivita/new"), basePayload("u")));
  });

  it("update allowed when updatedBy=auth.uid and updatedByName=token.name", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertSucceeds(
      updateDoc(doc(db, "attivita/a1"), {
        tariffa: 60,
        totale: 60,
        updatedAt: serverTimestamp(),
        updatedBy: "owner-uid",
        updatedByName: "Owner",
      })
    );
  });

  it("update denied when updatedBy is spoofed", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        tariffa: 60,
        updatedAt: serverTimestamp(),
        updatedBy: "other-uid",
      })
    );
  });

  it("update denied when updatedByName mismatches token.name", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"]);
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        tariffa: 60,
        updatedAt: serverTimestamp(),
        updatedBy: "owner-uid",
        updatedByName: "Mario Rossi",
      })
    );
  });

  it("update denied when updatedByName starts with csv formula prefix", async () => {
    const env = await getEnv();
    const db = authedAs(env, "owner-uid", ["activities.update.own"], {
      name: "=cmd",
    });
    await assertFails(
      updateDoc(doc(db, "attivita/a1"), {
        tariffa: 60,
        updatedAt: serverTimestamp(),
        updatedBy: "owner-uid",
        updatedByName: "=cmd",
      })
    );
  });
});
