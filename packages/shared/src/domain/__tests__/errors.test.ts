import { describe, expect, it } from "vitest";
import {
  ConflictError,
  DomainError,
  NotFoundError,
  PermissionDeniedError,
  StaleStateError,
} from "../errors.js";

describe("DomainError hierarchy", () => {
  it("NotFoundError carries resource + id and a not-found code", () => {
    const e = new NotFoundError("user", "u1");
    expect(e).toBeInstanceOf(DomainError);
    expect(e).toBeInstanceOf(Error);
    expect(e.code).toBe("not-found");
    expect(e.resource).toBe("user");
    expect(e.id).toBe("u1");
    expect(e.message).toBe("user u1 not found");
    expect(e.name).toBe("NotFoundError");
  });

  it("PermissionDeniedError sets permission-denied code and preserves message", () => {
    const e = new PermissionDeniedError("missing cap conti.emit");
    expect(e.code).toBe("permission-denied");
    expect(e.message).toBe("missing cap conti.emit");
    expect(e.name).toBe("PermissionDeniedError");
  });

  it("ConflictError sets conflict code with resource and message", () => {
    const e = new ConflictError("allowlist", "duplicate emailNorm");
    expect(e.code).toBe("conflict");
    expect(e.resource).toBe("allowlist");
    expect(e.message).toBe("duplicate emailNorm");
    expect(e.name).toBe("ConflictError");
  });

  it("StaleStateError sets stale-state code with resource and message", () => {
    const e = new StaleStateError("conto", "already saldato");
    expect(e.code).toBe("stale-state");
    expect(e.resource).toBe("conto");
    expect(e.message).toBe("already saldato");
    expect(e.name).toBe("StaleStateError");
  });

  it("preserves a cause across the hierarchy", () => {
    const cause = new Error("upstream");
    const e = new NotFoundError("user", "u1", { cause });
    expect(e.cause).toBe(cause);
  });

  it("each variant is matchable via discriminated code", () => {
    const errors: DomainError[] = [
      new NotFoundError("user", "u1"),
      new PermissionDeniedError("nope"),
      new ConflictError("allowlist", "dup"),
      new StaleStateError("conto", "already"),
    ];
    const codes = errors.map((e) => e.code);
    expect(codes).toEqual([
      "not-found",
      "permission-denied",
      "conflict",
      "stale-state",
    ]);
  });
});
