import { afterAll, beforeAll, describe, it } from "vitest";
import { assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { disposeEnv, getEnv } from "./setup";

describe("default deny", () => {
  beforeAll(async () => { await getEnv(); });
  afterAll(async () => { await disposeEnv(); });

  it("anonymous user cannot read any document", async () => {
    const env = await getEnv();
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "anything/x")));
  });

  it("anonymous user cannot write any document", async () => {
    const env = await getEnv();
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "anything/x"), { v: 1 }));
  });

  it("authenticated user without claims cannot read", async () => {
    const env = await getEnv();
    const db = env.authenticatedContext("user-1").firestore();
    await assertFails(getDoc(doc(db, "anything/x")));
  });
});
