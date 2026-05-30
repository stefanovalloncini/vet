import { describe, expect, it } from "vitest";
import { buildOptimisticEntity } from "../_shared.js";

describe("buildOptimisticEntity", () => {
  it("stamps serverTimestamp with the local `now` and parses with the id", () => {
    const now = new Date("2026-05-30T00:00:00.000Z");
    const created = new Date("2026-01-01T00:00:00.000Z");

    const result = buildOptimisticEntity<{
      id: string;
      createdAt: Date;
      updatedAt: Date;
      name: string;
    }>({
      id: "x1",
      now,
      buildDoc: (deps) => ({
        createdAt: deps.fromDate(created),
        updatedAt: deps.serverTimestamp(),
        name: "foo",
      }),
      parse: (id, raw) => ({ id, ...(raw as Record<string, unknown>) }) as {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
      },
    });

    // fromDate is identity, serverTimestamp resolves to `now` (no FieldValue sentinel),
    // so the optimistic entity is immediately renderable.
    expect(result).toEqual({
      id: "x1",
      createdAt: created,
      updatedAt: now,
      name: "foo",
    });
  });
});
