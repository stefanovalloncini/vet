import { describe, expect, it } from "vitest";
import type { AccessRequest, User } from "@vet/shared";
import {
  mergeAccessQueue,
  type AccessQueueRow,
} from "../mergeAccessQueue";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: "u1",
    email: "pending@vet.it",
    displayName: "Mario Pendente",
    roleId: "vet",
    approved: false,
    disabled: false,
    createdAt: new Date("2026-01-10T09:00:00Z"),
    updatedAt: new Date("2026-01-10T09:00:00Z"),
    schemaVersion: 1,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<AccessRequest> = {}): AccessRequest {
  return {
    emailNorm: "asker@vet.it",
    email: "asker@vet.it",
    firstAttemptAt: new Date("2026-01-01T10:00:00Z"),
    lastAttemptAt: new Date("2026-01-02T10:00:00Z"),
    attempts: 2,
    schemaVersion: 1,
    ...overrides,
  };
}

function emails(rows: AccessQueueRow[]): string[] {
  return rows.map((r) => r.emailNorm);
}

describe("mergeAccessQueue", () => {
  it("unions both sources into one queue", () => {
    const rows = mergeAccessQueue([makeUser()], [makeRequest()]);
    expect(emails(rows).sort()).toEqual(["asker@vet.it", "pending@vet.it"]);
  });

  it("tags pending users-docs and access requests with the right kind", () => {
    const rows = mergeAccessQueue([makeUser()], [makeRequest()]);
    const byEmail = new Map(rows.map((r) => [r.emailNorm, r]));
    expect(byEmail.get("pending@vet.it")?.kind).toBe("pending");
    expect(byEmail.get("asker@vet.it")?.kind).toBe("request");
  });

  it("dedupes by emailNorm, keeping the pending users-doc over the request", () => {
    const user = makeUser({ email: "Dup@Vet.it" });
    const request = makeRequest({ emailNorm: "dup@vet.it", email: "dup@vet.it" });
    const rows = mergeAccessQueue([user], [request]);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row?.kind).toBe("pending");
    if (row?.kind === "pending") expect(row.user).toBe(user);
  });

  it("normalizes the user email before deduping", () => {
    const user = makeUser({ email: "  Mixed@Case.IT " });
    const request = makeRequest({ emailNorm: "mixed@case.it", email: "mixed@case.it" });
    const rows = mergeAccessQueue([user], [request]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("pending");
  });

  it("carries the source date: createdAt for pending, firstAttemptAt for requests", () => {
    const user = makeUser({ createdAt: new Date("2026-02-01T00:00:00Z") });
    const request = makeRequest({
      firstAttemptAt: new Date("2026-03-01T00:00:00Z"),
    });
    const rows = mergeAccessQueue([user], [request]);
    const byEmail = new Map(rows.map((r) => [r.emailNorm, r]));
    expect(byEmail.get("pending@vet.it")?.date.toISOString()).toBe(
      "2026-02-01T00:00:00.000Z"
    );
    expect(byEmail.get("asker@vet.it")?.date.toISOString()).toBe(
      "2026-03-01T00:00:00.000Z"
    );
  });

  it("sorts newest first by date", () => {
    const older = makeRequest({
      emailNorm: "old@vet.it",
      email: "old@vet.it",
      firstAttemptAt: new Date("2026-01-01T00:00:00Z"),
    });
    const newer = makeUser({
      email: "new@vet.it",
      createdAt: new Date("2026-06-01T00:00:00Z"),
    });
    const rows = mergeAccessQueue([newer], [older]);
    expect(emails(rows)).toEqual(["new@vet.it", "old@vet.it"]);
  });

  it("returns an empty queue when both sources are empty", () => {
    expect(mergeAccessQueue([], [])).toEqual([]);
  });
});
