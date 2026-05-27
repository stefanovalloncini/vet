import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildWhatsappShareUrl,
  openWhatsappShare,
} from "../share/whatsapp";

describe("buildWhatsappShareUrl", () => {
  it("encodes simple text and omits the phone when not provided", () => {
    const url = buildWhatsappShareUrl({ text: "Ciao" });
    expect(url).toBe("https://wa.me/?text=Ciao");
  });

  it("URL-encodes Italian accents", () => {
    const url = buildWhatsappShareUrl({ text: "Perché città" });
    expect(url).toContain("Perch%C3%A9");
    expect(url).toContain("citt%C3%A0");
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);
  });

  it("URL-encodes newlines and ampersands", () => {
    const url = buildWhatsappShareUrl({
      text: "Linea 1\nLinea 2 & altro",
    });
    expect(url).toContain("%0A");
    expect(url).toContain("%26");
    // Raw ampersand must not appear in the encoded payload portion.
    const payload = url.slice("https://wa.me/?text=".length);
    expect(payload.includes("&")).toBe(false);
  });

  it("includes the phone number in the path when supplied", () => {
    const url = buildWhatsappShareUrl({
      text: "Ciao",
      phone: "393331234567",
    });
    expect(url).toBe("https://wa.me/393331234567?text=Ciao");
  });
});

describe("openWhatsappShare", () => {
  const originalOpen = window.open;

  afterEach(() => {
    window.open = originalOpen;
  });

  it("calls window.open with the built URL and _blank target", () => {
    const fakeWindow = {} as Window;
    const openSpy: typeof window.open = vi.fn(
      () => fakeWindow,
    ) as unknown as typeof window.open;
    window.open = openSpy;

    const result = openWhatsappShare({
      text: "Ciao",
      phone: "39333",
    });

    const mock = openSpy as unknown as ReturnType<typeof vi.fn>;
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(
      "https://wa.me/39333?text=Ciao",
      "_blank",
      expect.stringContaining("noopener"),
    );
    expect(result).toBe(true);
  });

  it("returns false when the popup was blocked", () => {
    window.open = vi.fn(() => null) as unknown as typeof window.open;
    const result = openWhatsappShare({ text: "Ciao" });
    expect(result).toBe(false);
  });
});
