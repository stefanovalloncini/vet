import { afterAll, beforeAll, describe, it } from "vitest";
import { assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";
import { adminAs } from "./helpers";

const SERVER_ONLY_COLLECTIONS = [
  "signInTickets",
  "appCheckRateLimits",
  "auditRateLimits",
  "mail",
] as const;

describe("server-only collections deny all client access", () => {
  beforeAll(async () => {
    await getEnv();
  });
  afterAll(async () => {
    await disposeEnv();
  });

  for (const coll of SERVER_ONLY_COLLECTIONS) {
    it(`anonymous client cannot read or write ${coll}`, async () => {
      const env = await getEnv();
      const db = env.unauthenticatedContext().firestore();
      await assertFails(getDoc(doc(db, `${coll}/x`)));
      await assertFails(setDoc(doc(db, `${coll}/x`), { v: 1 }));
    });

    it(`full-caps admin client cannot read or write ${coll}`, async () => {
      const env = await getEnv();
      const db = adminAs(env, "admin");
      await assertFails(getDoc(doc(db, `${coll}/x`)));
      await assertFails(setDoc(doc(db, `${coll}/x`), { v: 1 }));
    });
  }
});
