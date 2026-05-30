import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { decodeCaps } from "@vet/shared";

const HERE = dirname(fileURLToPath(import.meta.url));
const RULES_SOURCE = readFileSync(
  resolve(HERE, "../../../firestore.rules"),
  "utf8"
);

function capCodesUsedInRules(): string[] {
  const codes = new Set<string>();
  const re = /hasCap\(\s*"([a-z]+)"\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(RULES_SOURCE)) !== null) {
    codes.add(match[1]!);
  }
  return [...codes].sort();
}

describe("caps ↔ firestore.rules drift", () => {
  it("uses hasCap with literal codes", () => {
    expect(capCodesUsedInRules().length).toBeGreaterThan(0);
  });

  it("every hasCap(code) maps to a registry capability (no ungrantable caps)", () => {
    const orphans = capCodesUsedInRules().filter(
      (code) => decodeCaps([code]).length !== 1
    );
    expect(orphans).toEqual([]);
  });
});
