import { afterEach, describe, expect, it, vi } from "vitest";
import { buildWhatsappShareUrl, openWhatsappShare } from "../whatsapp";

describe("buildWhatsappShareUrl", () => {
  it("URL-encodes the caption so special characters survive", () => {
    const url = buildWhatsappShareUrl({
      text: "Conto pronto & salvato #3 — apri l'allegato",
    });
    expect(url).toContain("text=");
    expect(url).not.toContain(" ");
    expect(url).not.toContain("&apri");
    expect(decodeURIComponent(url.split("text=")[1]!)).toBe(
      "Conto pronto & salvato #3 — apri l'allegato"
    );
  });

  it("includes the phone number in the path when provided", () => {
    const url = buildWhatsappShareUrl({ text: "ciao", phone: "393331234567" });
    expect(url).toBe("https://wa.me/393331234567?text=ciao");
  });

  it("opens a generic share dialog when no phone is given", () => {
    const url = buildWhatsappShareUrl({ text: "ciao" });
    expect(url).toBe("https://wa.me/?text=ciao");
  });

  it("encodes newlines in multi-line captions", () => {
    const url = buildWhatsappShareUrl({ text: "riga1\nriga2" });
    expect(url).toContain("riga1%0Ariga2");
  });
});

describe("openWhatsappShare", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the share URL in a new tab and reports success", () => {
    const open = vi
      .spyOn(window, "open")
      .mockReturnValue({} as unknown as Window);
    const ok = openWhatsappShare({ text: "ciao", phone: "39333" });
    expect(open).toHaveBeenCalledWith(
      "https://wa.me/39333?text=ciao",
      "_blank",
      "noopener,noreferrer"
    );
    expect(ok).toBe(true);
  });

  it("reports failure when the popup is blocked", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    expect(openWhatsappShare({ text: "ciao" })).toBe(false);
  });
});
