import { afterEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  idTokenCb: undefined as ((u: unknown) => void) | undefined,
}));

vi.mock("firebase/auth", () => ({
  onIdTokenChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    h.idTokenCb = cb;
    return () => {};
  },
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  onSnapshot: vi.fn(() => () => {}),
}));

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn()),
}));

import { FirebaseAuthService } from "../FirebaseAuthService";

const authStub: { currentUser: { uid: string } | null } = { currentUser: null };

function deferred<T>(): { promise: Promise<T>; resolve: (v: T) => void } {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function tokenResult(caps: string[] = []) {
  return { claims: { vet: true, roleId: "r", caps, name: "N" } };
}

function makeFbUser(uid: string, getIdTokenResult: () => Promise<unknown>) {
  return { uid, email: `${uid}@example.com`, displayName: uid, getIdTokenResult };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

function newService() {
  return new FirebaseAuthService(authStub as never, {} as never);
}

afterEach(() => {
  h.idTokenCb = undefined;
  authStub.currentUser = null;
  vi.clearAllMocks();
});

describe("FirebaseAuthService", () => {
  it("sets the current user on a normal sign-in", async () => {
    const svc = newService();
    authStub.currentUser = { uid: "A" };
    h.idTokenCb!(makeFbUser("A", async () => tokenResult(["zr"])));
    await flush();
    expect(svc.getCurrentUser()?.uid).toBe("A");
    expect(svc.getCurrentUser()?.caps.has("aziende.read")).toBe(true);
  });

  it("does not resurrect a signed-out session when a token result resolves after logout", async () => {
    const svc = newService();
    const d = deferred<unknown>();
    authStub.currentUser = { uid: "A" };
    h.idTokenCb!(makeFbUser("A", () => d.promise));

    // Logout lands while A's getIdTokenResult is still pending.
    authStub.currentUser = null;
    h.idTokenCb!(null);
    expect(svc.getCurrentUser()).toBeNull();

    // A's token result now resolves — the stale actor must NOT be applied.
    d.resolve(tokenResult());
    await flush();
    expect(svc.getCurrentUser()).toBeNull();
  });
});
