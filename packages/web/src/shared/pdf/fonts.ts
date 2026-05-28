import { Font } from "@react-pdf/renderer";

let registered = false;

export function ensureFontsRegistered(): void {
  if (registered) return;
  registered = true;

  Font.registerHyphenationCallback((word: string) => [word]);
}
