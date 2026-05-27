export interface WhatsappShareInput {
  /** Italian caption. */
  text: string;
  /**
   * Optional phone number with country code, no plus, no spaces
   * (e.g. "39333…"). When omitted, opens a generic share dialog.
   */
  phone?: string;
}

/**
 * Builds a `wa.me` URL with the caption encoded as the `text` query param.
 *
 * Note: WhatsApp's URL scheme does NOT support attaching files. The user
 * has to attach the previously-downloaded PDF manually. Compose the caption
 * accordingly (mention that the PDF was just saved to their device).
 */
export function buildWhatsappShareUrl(input: WhatsappShareInput): string {
  const phone = input.phone ?? "";
  const text = encodeURIComponent(input.text);
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Opens the wa.me share URL in a new tab. Returns true if the popup was
 * likely created (i.e. window.open returned a truthy value).
 */
export function openWhatsappShare(input: WhatsappShareInput): boolean {
  const url = buildWhatsappShareUrl(input);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(win);
}
