import { describe, it, expect, vi, beforeEach } from "vitest";

const adminAuth = {
  getUserByEmail: vi.fn(),
  revokeRefreshTokens: vi.fn().mockResolvedValue(undefined),
  setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
  updateUser: vi.fn().mockResolvedValue(undefined),
};

const docSet = vi.fn().mockResolvedValue(undefined);
const collectionAdd = vi.fn().mockResolvedValue(undefined);
const adminDb = {
  collection: vi.fn((name: string) => {
    if (name === "users") {
      return { doc: vi.fn(() => ({ set: docSet })) };
    }
    if (name === "audit") {
      return { add: collectionAdd };
    }
    throw new Error("unexpected collection " + name);
  }),
};

vi.mock("../../admin/firebaseAdmin.js", () => ({
  adminAuth,
  adminDb,
}));

const { revokeForDeletedAllowlistEntry } = await import("../onAllowlistDelete.js");

beforeEach(() => {
  vi.clearAllMocks();
  docSet.mockResolvedValue(undefined);
  collectionAdd.mockResolvedValue(undefined);
});

describe("revokeForDeletedAllowlistEntry", () => {
  it("returns 'missing-email-in-doc' when both email and emailNorm are empty", async () => {
    const r = await revokeForDeletedAllowlistEntry({
      email: undefined,
      emailNorm: "",
    });
    expect(r.reason).toBe("missing-email-in-doc");
    expect(adminAuth.getUserByEmail).not.toHaveBeenCalled();
  });

  it("uses emailNorm as fallback when email is missing", async () => {
    adminAuth.getUserByEmail.mockResolvedValueOnce({ uid: "u1" });
    const r = await revokeForDeletedAllowlistEntry({
      email: undefined,
      emailNorm: "fallback@example.com",
    });
    expect(adminAuth.getUserByEmail).toHaveBeenCalledWith("fallback@example.com");
    expect(r).toEqual({ uid: "u1", reason: "revoked" });
  });

  it("returns 'user-not-found' when no auth user exists for email", async () => {
    adminAuth.getUserByEmail.mockRejectedValueOnce(
      new Error("There is no user record corresponding to the provided identifier.")
    );
    const r = await revokeForDeletedAllowlistEntry({
      email: "ghost@example.com",
      emailNorm: "ghost@example.com",
    });
    expect(r.reason).toBe("user-not-found");
    expect(adminAuth.revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it("revokes tokens, clears claims, disables, mirrors to firestore, audits", async () => {
    adminAuth.getUserByEmail.mockResolvedValueOnce({ uid: "u42" });
    const r = await revokeForDeletedAllowlistEntry({
      email: "kicked@example.com",
      emailNorm: "kicked@example.com",
    });
    expect(r).toEqual({ uid: "u42", reason: "revoked" });
    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith("u42");
    expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith("u42", null);
    expect(adminAuth.updateUser).toHaveBeenCalledWith("u42", { disabled: true });
    expect(docSet).toHaveBeenCalledTimes(1);
    expect(collectionAdd).toHaveBeenCalledTimes(1);
    const auditPayload = collectionAdd.mock.calls[0]?.[0] as {
      action: string;
      targetId: string;
    };
    expect(auditPayload.action).toBe("allowlist.delete.cascade");
    expect(auditPayload.targetId).toBe("u42");
  });

  it("re-throws unexpected errors so the trigger retries", async () => {
    adminAuth.getUserByEmail.mockRejectedValueOnce(new Error("network down"));
    await expect(
      revokeForDeletedAllowlistEntry({
        email: "x@y.test",
        emailNorm: "x@y.test",
      })
    ).rejects.toThrow(/network down/);
  });
});
