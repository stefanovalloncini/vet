import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const FONTS_SOURCE = readFileSync(
  resolve(HERE, "../fonts.ts"),
  "utf8",
);
const STYLES_SOURCE = readFileSync(
  resolve(HERE, "../styles.ts"),
  "utf8",
);

describe("pdf fonts", () => {
  it("does not fetch fonts from a remote origin at runtime", () => {
    expect(FONTS_SOURCE).not.toMatch(/https?:\/\//);
    expect(FONTS_SOURCE).not.toMatch(/gstatic/i);
  });

  it("does not register a font family that depends on a remote src", () => {
    const registered: Array<Record<string, unknown>> = [];
    vi.resetModules();
    vi.doMock("@react-pdf/renderer", () => ({
      Font: {
        register: (cfg: Record<string, unknown>) => registered.push(cfg),
        registerHyphenationCallback: () => undefined,
      },
    }));

    return import("../fonts").then(({ ensureFontsRegistered }) => {
      ensureFontsRegistered();
      for (const cfg of registered) {
        const fonts = (cfg["fonts"] as Array<{ src?: string }>) ?? [];
        for (const f of fonts) {
          expect(f.src ?? "").not.toMatch(/https?:\/\//);
        }
        const single = cfg["src"];
        if (typeof single === "string") {
          expect(single).not.toMatch(/https?:\/\//);
        }
      }
      vi.doUnmock("@react-pdf/renderer");
    });
  });

  it("does not pin PDF styles to a custom family that needs remote registration", () => {
    expect(STYLES_SOURCE).not.toMatch(/fontFamily:\s*"Inter"/);
  });
});
