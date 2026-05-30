import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  formatBytes,
  renderDigestHtml,
  weekLabel,
  type DigestDay,
} from "../weeklyBackupDigest";

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&#39;");
  });

  it("escapes & first so existing entities are not double-mangled", () => {
    expect(escapeHtml("a & b < c")).toBe("a &amp; b &lt; c");
  });

  it("neutralizes a script payload", () => {
    const out = escapeHtml("<script>alert(1)</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("leaves plain text untouched", () => {
    expect(escapeHtml("Cascina Verdi 2026")).toBe("Cascina Verdi 2026");
  });
});

describe("formatBytes", () => {
  it("formats bytes, KB, and MB across the boundaries", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("weekLabel", () => {
  it("returns a non-empty range label including the year", () => {
    const label = weekLabel(new Date(2026, 4, 29));
    expect(label.length).toBeGreaterThan(0);
    expect(label).toContain("2026");
  });
});

describe("renderDigestHtml", () => {
  it("escapes day date and folder link (no HTML/attribute breakout)", () => {
    const days: DigestDay[] = [
      {
        date: "<img src=x onerror=alert(1)>",
        folderId: "f1",
        folderLink: 'https://drive/"><script>bad()</script>',
        manifest: null,
      },
    ];
    const html = renderDigestHtml({ weekLabel: "settimana", days });
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>bad()");
    expect(html).toContain("&lt;img");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });
});
