import { describe, expect, it } from "vitest";
import { readActorClaims } from "../actorClaims.js";

describe("readActorClaims", () => {
  it("decodes short cap codes and keeps the email", () => {
    expect(readActorClaims({ email: "vet@example.com", caps: ["uap", "zr"] })).toEqual({
      email: "vet@example.com",
      caps: ["users.approve", "aziende.read"],
    });
  });

  it("accepts full capability names too", () => {
    expect(readActorClaims({ caps: ["users.approve"] }).caps).toEqual([
      "users.approve",
    ]);
  });

  it("defaults email to empty string when absent", () => {
    expect(readActorClaims({ caps: ["zr"] }).email).toBe("");
  });

  it("defaults caps to empty array when absent", () => {
    expect(readActorClaims({ email: "a@b.com" }).caps).toEqual([]);
  });

  it("falls back to empty email when email is the wrong type", () => {
    expect(readActorClaims({ email: 123, caps: ["zr"] })).toEqual({
      email: "",
      caps: ["aziende.read"],
    });
  });

  it("falls back to empty caps when caps is not an array", () => {
    expect(readActorClaims({ email: "a@b.com", caps: "zr" })).toEqual({
      email: "a@b.com",
      caps: [],
    });
  });

  it("drops non-string and unknown cap entries but keeps valid ones", () => {
    expect(readActorClaims({ caps: ["zr", 5, "bogus", "uap"] }).caps).toEqual([
      "aziende.read",
      "users.approve",
    ]);
  });

  it("returns safe defaults for non-object tokens", () => {
    expect(readActorClaims(undefined)).toEqual({ email: "", caps: [] });
    expect(readActorClaims(null)).toEqual({ email: "", caps: [] });
    expect(readActorClaims("nope")).toEqual({ email: "", caps: [] });
  });
});
