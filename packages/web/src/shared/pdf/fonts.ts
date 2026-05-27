import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Register Inter family (regular, medium, semibold).
 * Idempotent — safe to call repeatedly. Safe to call on the server
 * (functions runtime) because `@react-pdf` fetches the URLs itself.
 */
export function ensureFontsRegistered(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Inter",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50ojIo2A.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50ojIv2g.ttf",
        fontWeight: 500,
      },
      {
        src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50ojIh3Q.ttf",
        fontWeight: 600,
      },
    ],
  });

  // Disable hyphenation: Italian client documents read better unbroken.
  Font.registerHyphenationCallback((word: string) => [word]);
}
